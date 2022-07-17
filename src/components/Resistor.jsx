import React, { useState } from 'react';
import { Box, Line, Text } from '@react-three/drei';
import { Vector3 } from 'three';
import PropTypes from 'prop-types';
import idFromPoints from '../utils/utils';

const RESISTOR_COLOR = '#f33';

export default function Resistor({ src, dst, current }) {
  const theeSrc = new Vector3(...src);
  const threeDst = new Vector3(...dst);
  const center = theeSrc.clone().add(threeDst).multiplyScalar(0.5);
  const diff = threeDst.clone().sub(theeSrc);
  const dir = diff.clone().normalize();
  const normal = diff.clone().cross(new Vector3(0, 0, 1)).normalize();
  const start = center.clone().sub(dir.clone().multiplyScalar(0.5));
  const end = center.clone().add(dir.clone().multiplyScalar(0.5));

  const sharpPoints = [...Array(6).keys()].map(
    (x) => {
      const p = start.clone().add(dir.clone().multiplyScalar((1 / 6) * (x + 0.5)));
      p.add(normal.clone().multiplyScalar(x % 2 ? 0.2 : -0.2));
      return p;
    },
  );
  const subPoints = [start, ...sharpPoints, end];
  const middleLines = subPoints.slice(0, subPoints.length - 1).map((p, index) => (
    <Line
      points={[p, subPoints[index + 1]]}
      color={RESISTOR_COLOR}
      lineWidth={1}
      key={idFromPoints(p, subPoints[index + 1])}
    />
  ));

  const [hovered, hover] = useState(new Vector3(10000, 0, 0));
  return (
    <group>
      <Box
        position={center}
        args={[0.5, 1.5, 0.0001]}
        visible={false}
        onPointerMove={(ev) => { hover(ev.point); }}
        onPointerLeave={() => hover(new Vector3(10000, 0, 0))}
      />
      <Line
        points={[theeSrc, start]}
        color={RESISTOR_COLOR}
        lineWidth={1}
      />
      <Line
        points={[end, threeDst]}
        color={RESISTOR_COLOR}
        lineWidth={1}
      />
      {middleLines}
      <Text color="white" fontSize={0.1} anchorX="center" anchorY="middle" position={hovered}>
        {Math.round(current * 1000)}
        {' '}
        mA
      </Text>
    </group>
  );
}
Resistor.propTypes = {
  src: PropTypes.instanceOf(Vector3).isRequired,
  dst: PropTypes.instanceOf(Vector3).isRequired,
  current: PropTypes.number.isRequired,
};
