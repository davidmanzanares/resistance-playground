import React from 'react';
import PropTypes from 'prop-types';
import { Vector3 } from 'three';
import { Line } from '@react-three/drei';

export default function Battery({ negative, positive }) {
  const neg = new Vector3(...negative);
  const pos = new Vector3(...positive);
  const center = neg.clone().add(pos).multiplyScalar(0.5);
  const diff = pos.clone().sub(neg);
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
        points={[neg, negativeMid]}
        color="#fcde9c"
        lineWidth={1}
      />
      <Line
        points={[negativePerpendicularA, negativePerpendicularB]}
        color="#fcde9c"
        lineWidth={1}
      />
      <Line
        points={[positiveMid, pos]}
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
Battery.propTypes = {
  negative: PropTypes.arrayOf(PropTypes.number).isRequired,
  positive: PropTypes.arrayOf(PropTypes.number).isRequired,
};
