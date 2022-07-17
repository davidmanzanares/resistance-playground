import * as THREE from 'three'
import * as React from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, Point, Points } from '@react-three/drei'
import { useRef } from 'react'

function ElectricalLine(props){
  const color1 = new THREE.Color( 0xfcde9c );
  const color2 = new THREE.Color( 0x7c1d6f );
  const color = color1.lerp(color2, props.voltage);

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
  const pointRefs = [...Array(numPoints).keys()].map(useRef);
  const electricPoints = pointRefs.map((ref, i) => 
    (<Point position={vToPos(i/density)} key={i} ref={ref} v={i/density}/>)
  );

  useFrame((state, delta) => {
    pointRefs.forEach(ref => {
      ref.current.v = (1.*delta + ref.current.v) % lineLength;
      const p = vToPos(ref.current.v);
      ref.current.position.set(p.x, p.y, p.z);
    });
  });
  return (
    <group>
      {lines}
      <Points
        limit={1000} // Optional: max amount of items (for calculating buffer size)
        range={1000} // Optional: draw-range
      >
        <pointsMaterial  color={color} size={0.06}/>
        {electricPoints}
      </Points>
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

class Resistor extends React.Component{
  render(){
    const src = new THREE.Vector3(...this.props.src);
    const dst = new THREE.Vector3(...this.props.dst);
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
      color="red"
      lineWidth={1}
      key={index}
      />);
    });

    return (
      <group>
      <Line
        points={[src, start]}
        color="red"
        lineWidth={1}
        />
      <Line
        points={[end, dst]}
        color="red"
        lineWidth={1}
        />
      {middleLines}
      </group>
    )
  }
}


export default function Viewer() {
  return (
    <Canvas>
      <Battery negative={[-0.4,3,0]} positive={[0.1,3,0]}></Battery>
      <ElectricalLine points={[[0.1, 3, 0], [2,3,0], [2,0,0]]} voltage={1} current={0.5}></ElectricalLine>
      <Resistor src={[-2,-1,0]} dst={[2, -1, 0]}></Resistor>
    </Canvas>
  )
}