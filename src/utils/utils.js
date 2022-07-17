export default function idFromPoints(...points) {
  const s = points.map((p) => `${p.x}-${p.y}-${p.z}`).join('_');
  return s;
}
