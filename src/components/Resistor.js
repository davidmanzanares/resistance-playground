import { Box, Line, Text } from "@react-three/drei";
import { useState } from "react";
import { Vector3 } from "three";

const RESISTOR_COLOR = "#f33"

export default function Resistor (props) {
    const src = new Vector3(...props.src);
    const dst = new Vector3(...props.dst);
    const center = src.clone().add(dst).multiplyScalar(0.5);
    const diff = dst.clone().sub(src);
    const dir = diff.clone().normalize();
    const normal = diff.clone().cross(new Vector3(0, 0, 1)).normalize();
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

    const [hovered, hover] = useState(new Vector3(10000,0,0));
    return (
      <group>
      <Box position={center} args={[0.5,1.5,0.0001]} visible={false} 
        onPointerMove={ev => {hover(ev.point)}} onPointerLeave={ev=> hover(new Vector3(10000,0,0))}/>
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
