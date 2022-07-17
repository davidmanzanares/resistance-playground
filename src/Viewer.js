import * as THREE from 'three'
import * as React from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, Point, Points } from '@react-three/drei'
import { useRef } from 'react'

function ElectricalLine(props){
  // #,#faa476,#f0746e,#e34f6f,#dc3977,#b9257a,#7c1d6f
  const color1 = new THREE.Color( 0xfcde9c );
  const color2 = new THREE.Color( 0x7c1d6f );
  const color = color1.lerp(color2, props.voltage);
  const src = new THREE.Vector3(...props.src);
  const dst = new THREE.Vector3(...props.dst);
  const diff = dst.clone().sub(src);
  const dir = diff.clone().normalize();
  const normal = diff.clone().cross(new THREE.Vector3(0, 0, 1)).normalize();

  const density = 6;
  const numPoints = Math.floor(diff.length()*density);
  const pointRefs = [...Array(numPoints).keys()].map(useRef);
  const electricPoints = pointRefs.map((ref, x) =>
    (<Point position={src.clone().add(dir.clone().multiplyScalar(x/density))} key={x} ref={ref} x={x/numPoints}/>)
  );
  useFrame((state, delta) => {
    pointRefs.forEach(ref => {
      ref.current.x += 0.4*delta;
      ref.current.x -= Math.floor(ref.current.x);
      ref.current.position.lerpVectors(src, dst, ref.current.x);
    });
  });
  return (
    <group>
      <Line
      points={[props.src, props.dst]}
      color="white"
      lineWidth={1}
      />
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

class Cable extends React.Component{
  render() {
    return (
      <Line
        points={[this.props.src, this.props.dst]}
        color="gray"
        lineWidth={1}
        />
    )
  }
}

class Battery extends React.Component{
  render(){
    const negative = new THREE.Vector3(...this.props.negative);
    const positive = new THREE.Vector3(...this.props.positive);
    const center = negative.clone().add(positive).multiplyScalar(0.5);
    const negativeToPositive = positive.clone().sub(negative);
    const negativeMid = center.clone().sub(negativeToPositive.multiplyScalar(0.2));
    const positiveMid = center.clone().add(negativeToPositive.multiplyScalar(0.2));
    const normal = negativeToPositive.clone().cross(new THREE.Vector3(0, 0, 1)).normalize();
    const negativePerpendicularA = negativeMid.clone().add(normal.clone().multiplyScalar(0.25));
    const negativePerpendicularB = negativeMid.clone().sub(normal.clone().multiplyScalar(0.25));
    const positivePerpendicularA = positiveMid.clone().add(normal.clone().multiplyScalar(0.5));
    const positivePerpendicularB = positiveMid.clone().sub(normal.clone().multiplyScalar(0.5));
    return (
      <group>
      <Line
        points={[negative, negativeMid]}
        color="blue"
        lineWidth={1}
        />
      <Line
        points={[negativePerpendicularA, negativePerpendicularB]}
        color="blue"
        lineWidth={1}
        />
      <Line
        points={[positiveMid, positive]}
        color="red"
        lineWidth={1}
        />
      <Line
        points={[positivePerpendicularA, positivePerpendicularB]}
        color="red"
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
      <Battery negative={[-0.5,3,0]} positive={[0.5,3,0]}></Battery>
      <ElectricalLine src={[0.5, 3, 0]} dst={[2,3,0]} voltage={1} current={0.5}></ElectricalLine>
      <Cable src={[2, 3, 0]} dst={[2,0,0]}></Cable>
      <Resistor src={[-2,-1,0]} dst={[2, -1, 0]}></Resistor>
    </Canvas>
  )
}