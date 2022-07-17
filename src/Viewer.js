import * as THREE from 'three'
import * as React from 'react'
import { Canvas } from '@react-three/fiber'
import { Line } from '@react-three/drei'

class Cable extends React.Component{
  render() {
    return (
      <Line
        points={[this.props.src, this.props.dst]}
        color="gray"
        lineWidth={1}
        dashed={false}
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
      <Cable src={[0.5, 3, 0]} dst={[2,3,0]}></Cable>
      <Cable src={[2, 3, 0]} dst={[2,0,0]}></Cable>
      <Resistor src={[-2,-1,0]} dst={[2, -1, 0]}></Resistor>
    </Canvas>
  )
}