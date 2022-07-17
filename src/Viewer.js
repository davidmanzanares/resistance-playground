import * as THREE from 'three'
import * as React from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Box, Line, Point, Points, Text } from '@react-three/drei'
import { useRef, useState } from 'react'

const RESISTOR_COLOR = "#f33"

function clamp(x, min, max){
  return Math.min(Math.max(x, min), max);
}

function ElectricalLine(props){
  const colors = [0xfcde9c,0xfaa476,0xf0746e,0xe34f6f,0xdc3977,0xb9257a,0x7c1d6f];
  const color = colors[clamp(Math.round(props.voltage), 0, colors.length-1)];

  const directions = [];
  const segmentLengths = [];
  const points = props.points.map(p => new THREE.Vector3(...p));
  const lines = [];
  points.slice(0, points.length-1).forEach((src, i) => {
    const dst = points[i+1];
    const diff = dst.clone().sub(src);
    segmentLengths.push(diff.length());
    directions.push(diff.normalize());
    lines.push((<Line
      points={[src, dst]}
      color="white"
      lineWidth={1}
      key={i}
      />));
  });
  const lineLength = segmentLengths.reduce((x,y)=>x+y);

  function vToPos(v) {
    for (let i=0; i<segmentLengths.length; i++){
      if (v<segmentLengths[i]){
        return points[i].clone().add(directions[i].clone().multiplyScalar(v));
      }
      v-= segmentLengths[i];
    }
    return new THREE.Vector3();
  }

  const density = 6;
  const numPoints = Math.round(lineLength*density);
  const pointRefs = useRef([]);
  pointRefs.current = [...Array(numPoints).keys()].map(i => pointRefs.current[i] ?? React.createRef());
  const electricPoints = [...Array(numPoints).keys()].map(i => 
    (<Point position={vToPos(i/density)} key={i} ref={pointRefs.current[i]} v={i/density}/>)
  );

  useFrame((state, delta) => {
    electricPoints.forEach((_, i) => {
      const ref = pointRefs.current[i];
      ref.current.v = (4.*delta*props.current + ref.current.v) % lineLength;
      const p = vToPos(ref.current.v);
      ref.current.position.set(p.x, p.y, p.z);
    });
  });
  const [hovered, hover] = useState(new THREE.Vector3(10000,0,0));
  return (
    <group>
    <group onPointerMove={ev => {hover(ev.point)}} onPointerLeave={ev=> hover(new THREE.Vector3(10000,0,0))}>
      {lines}
    </group>
      <Points
        limit={1000} // Optional: max amount of items (for calculating buffer size)
        range={1000} // Optional: draw-range
      >
        <pointsMaterial  color={color} size={0.06}/>
        {electricPoints}
      </Points>
    <Text color="white" fontSize={0.1} anchorX="left" anchorY="bottom" position={hovered}>
      {Math.round(props.current*1000)} mA // {props.voltage.toFixed(1)} V
       </Text>
    </group>
  )
}

class Battery extends React.Component{
  render(){
    const negative = new THREE.Vector3(...this.props.negative);
    const positive = new THREE.Vector3(...this.props.positive);
    const center = negative.clone().add(positive).multiplyScalar(0.5);
    const diff = positive.clone().sub(negative);
    const dir = diff.clone().normalize();
    const negativeMid = center.clone().sub(dir.clone().multiplyScalar(0.05));
    const positiveMid = center.clone().add(dir.clone().multiplyScalar(0.1));
    const normal = diff.clone().cross(new THREE.Vector3(0, 0, 1)).normalize();
    const negativePerpendicularA = negativeMid.clone().add(normal.clone().multiplyScalar(0.25));
    const negativePerpendicularB = negativeMid.clone().sub(normal.clone().multiplyScalar(0.25));
    const positivePerpendicularA = positiveMid.clone().add(normal.clone().multiplyScalar(0.5));
    const positivePerpendicularB = positiveMid.clone().sub(normal.clone().multiplyScalar(0.5));
    return (
      <group>
      <Line
        points={[negative, negativeMid]}
        color="#fcde9c"
        lineWidth={1}
        />
      <Line
        points={[negativePerpendicularA, negativePerpendicularB]}
        color="#fcde9c"
        lineWidth={1}
        />
      <Line
        points={[positiveMid, positive]}
        color="#7c1d6f"
        lineWidth={1}
        />
      <Line
        points={[positivePerpendicularA, positivePerpendicularB]}
        color="#7c1d6f"
        lineWidth={1}
        />
      </group>
    )
  }
}

function Resistor (props) {
    const src = new THREE.Vector3(...props.src);
    const dst = new THREE.Vector3(...props.dst);
    const center = src.clone().add(dst).multiplyScalar(0.5);
    const diff = dst.clone().sub(src);
    const dir = diff.clone().normalize();
    const normal = diff.clone().cross(new THREE.Vector3(0, 0, 1)).normalize();
    const start = center.clone().sub(dir.clone().multiplyScalar(0.5));
    const end = center.clone().add(dir.clone().multiplyScalar(0.5));

    const sharpPoints = [...Array(6).keys()].map(x =>
      start.clone().add(dir.clone().multiplyScalar((1/6)*(x+0.5))).add(normal.clone().multiplyScalar(x%2? 0.2: -0.2))
    );
    const subPoints = [start, ...sharpPoints, end];
    const middleLines = subPoints.slice(0, subPoints.length-1).map((p, index) => {
      return       (<Line
      points={[p, subPoints[index+1]]}
      color={RESISTOR_COLOR}
      lineWidth={1}
      key={index}
      />);
    });

    const [hovered, hover] = useState(new THREE.Vector3(10000,0,0));
    return (
      <group>
      <Box position={center} args={[0.5,1.5,0.0001]} visible={false} 
        onPointerMove={ev => {hover(ev.point)}} onPointerLeave={ev=> hover(new THREE.Vector3(10000,0,0))}/>
      <Line
        points={[src, start]}
        color={RESISTOR_COLOR}
        lineWidth={1}
        />
      <Line
        points={[end, dst]}
        color={RESISTOR_COLOR}
        lineWidth={1}
        />
      {middleLines}
      <Text color="white" fontSize={0.1} anchorX="center" anchorY="middle" position={hovered}>
      {Math.round(props.current*1000)} mA
       </Text>
      </group>
    )
}

function Circuit(props) {
  const batteryVoltage = props.batteryVoltage;
  const circuit = props.circuit;
  function getCircuitResistance(circuit) {
    return circuit.map(parallelResistors =>  1 / parallelResistors.map(x=>1/x).reduce((x,y) => x+y))
            .reduce((x,y)=>x+y);
  }
  const circuitResistance = getCircuitResistance(circuit);
  const circuitCurrent = batteryVoltage/circuitResistance;

  const circuitComponents = [];
  const battery = (<Battery negative={[-0.4,3,0]} positive={[0.1,3,0]} key="battery"/>);
  circuitComponents.push(battery);
  circuitComponents.push((<Text color="white" fontSize={0.12} anchorX="center" anchorY="middle" position={[-0.15,2.35,0]} key="batteryLabel">
  {batteryVoltage} V
</Text>))
  const startDynamic = [2,2.5,0];
  const firstLine = (<ElectricalLine points={[[0.1,3,0], [2,3,0], startDynamic]} voltage={batteryVoltage} current={circuitCurrent} key="firstLine" />)
  circuitComponents.push(firstLine);

  let last = new THREE.Vector3(...startDynamic);
  let lastVoltage = batteryVoltage;
  circuit.forEach((resistors, i) => {
    if (resistors.length === 1){
      const vPostResistor = lastVoltage - circuitCurrent * resistors[0];
      const resistorEnd = last.clone().add(new THREE.Vector3(0, -1.2, 0));
      const lineEnd = resistorEnd.clone().add(new THREE.Vector3(0, -0.5, 0));
      const resistor = (<Resistor src={last} dst={resistorEnd} key={`R${i}`} current={circuitCurrent} />);
      circuitComponents.push(resistor);
      const labelPosition = last.clone().add(resistorEnd).multiplyScalar(0.5).add(new THREE.Vector3(0.5, 0, 0));
      circuitComponents.push((<Text color="white" fontSize={0.12} anchorX="center" anchorY="middle" position={labelPosition} key={`R${i}_label`}>
      {resistors[0]} Ohm
    </Text>))
      circuitComponents.push(<ElectricalLine points={[resistorEnd,  lineEnd]} voltage={vPostResistor} current={circuitCurrent} key={`L${i}`} />);
      last = lineEnd;
      lastVoltage = vPostResistor;
    } else if (resistors.length === 2) {
      const combinedResistance = 1 / resistors.map(parallelResistors => 1 / parallelResistors).reduce((x,y) => x+y);
      const vDrop = circuitCurrent * combinedResistance;
      const vPostResistors = lastVoltage - vDrop;
      const current1 = vDrop / resistors[0];
      const current2 = vDrop / resistors[1];
      const linePreMid1 = last.clone().add(new THREE.Vector3(0.5, 0., 0));
      const linePreEnd1 = last.clone().add(new THREE.Vector3(0.5, -0.5, 0));
      const linePreMid2 = last.clone().add(new THREE.Vector3(-0.5, 0., 0));
      const linePreEnd2 = last.clone().add(new THREE.Vector3(-0.5, -0.5, 0));
      const resistorEnd1 = linePreEnd1.clone().add(new THREE.Vector3(0, -1.2, 0));
      const resistorEnd2 = linePreEnd2.clone().add(new THREE.Vector3(0, -1.2, 0));
      const linePostMid1 = resistorEnd1.clone().add(new THREE.Vector3(0, -0.5, 0));
      const linePostMid2 = resistorEnd2.clone().add(new THREE.Vector3(0, -0.5, 0));
      const postResistorJunction = new THREE.Vector3(last.x, linePostMid1.y, last.z);
      const lineFinish = new THREE.Vector3(last.x, linePostMid1.y-0.5, last.z);
      circuitComponents.push(<ElectricalLine points={[last, linePreMid1, linePreEnd1]} voltage={lastVoltage} current={current1} key={`Lpre${i}_1`} />);
      circuitComponents.push(<ElectricalLine points={[last, linePreMid2, linePreEnd2]} voltage={lastVoltage} current={current2} key={`Lpre${i}_2`} />);
      circuitComponents.push(<Resistor src={linePreEnd1} dst={resistorEnd1} key={`R${i}_1`} current={current1} />);
      circuitComponents.push(<Resistor src={linePreEnd2} dst={resistorEnd2} key={`R${i}_2`} current={current2} />);

      const labelPosition1 = linePreEnd1.clone().add(resistorEnd1).multiplyScalar(0.5).add(new THREE.Vector3(0.45, 0, 0));
      circuitComponents.push((<Text color="white" fontSize={0.1} anchorX="center" anchorY="middle" position={labelPosition1} key={`R${i}_1_label`}>
      {resistors[0]} Ohm
    </Text>));
      const labelPosition2 = linePreEnd2.clone().add(resistorEnd2).multiplyScalar(0.5).add(new THREE.Vector3(0.45, 0, 0));
          circuitComponents.push((<Text color="white" fontSize={0.1} anchorX="center" anchorY="middle" position={labelPosition2} key={`R${i}_2_label`}>
          {resistors[1]} Ohm
        </Text>))

      circuitComponents.push(<ElectricalLine points={[resistorEnd1, linePostMid1, postResistorJunction]}
                              voltage={vPostResistors} current={current1} key={`Lpost${i}_1`} />);
      circuitComponents.push(<ElectricalLine points={[resistorEnd2, linePostMid2, postResistorJunction]}
                              voltage={vPostResistors} current={current2} key={`Lpost${i}_2`} />);
      circuitComponents.push(<ElectricalLine points={[postResistorJunction, lineFinish]}
                              voltage={vPostResistors} current={circuitCurrent} key={`Lafter${i}_2`} />);
      last = lineFinish;
      lastVoltage = vPostResistors;
    }
  });
  circuitComponents.push(<ElectricalLine points={[last, [-2,last.y,0], [-2,3,0], [-0.4,3,0]]}
                          voltage={lastVoltage} current={circuitCurrent} key={`lastLine`} />);
  return (<group>{circuitComponents}</group>)
}


export default function Viewer() {
  const [circuitValue, changeCircuit] = useState([
    [15],
    [30, 100],
    [5],
  ]);
  const [batteryVoltageValue, changeBatteryVoltage] = useState(7);

  function circuitChange(ev){
    const textarea = ev.target.value;
    const lines = textarea.split('\n');
    const circuit = lines.map(line => line.split(' ').map(parseFloat)).filter(resistors => resistors.every(r => !isNaN(r)));
    console.log(circuit)
    changeCircuit(circuit);
  }
  return (
    <div className="Viewer">
    <div className="panel">
      <h2>Circuit Configuration</h2>
      <h3>Battery</h3>
      <label>Voltage:</label>
      <input type="number" defaultValue="7" min="0" onChange={ev => changeBatteryVoltage(parseFloat(ev.target.value))}></input>
      <h3>Resistors</h3>
      <textarea defaultValue="15&#13;&#10;30 100&#13;&#10;5" rows="6" onChange={ev => circuitChange(ev)}>
      </textarea>
    </div>
    <Canvas>
      <Circuit circuit={circuitValue} batteryVoltage={batteryVoltageValue}></Circuit>
    </Canvas>
    </div>
  )
}