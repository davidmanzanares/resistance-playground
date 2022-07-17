import { Line } from "@react-three/drei";
import { Vector3 } from "three";

export default function Battery(props) {
    const negative = new Vector3(...props.negative);
    const positive = new Vector3(...props.positive);
    const center = negative.clone().add(positive).multiplyScalar(0.5);
    const diff = positive.clone().sub(negative);
    const dir = diff.clone().normalize();
    const negativeMid = center.clone().sub(dir.clone().multiplyScalar(0.05));
    const positiveMid = center.clone().add(dir.clone().multiplyScalar(0.1));
    const normal = diff.clone().cross(new Vector3(0, 0, 1)).normalize();
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
    );
}
