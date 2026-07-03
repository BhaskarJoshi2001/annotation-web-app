declare module 'simplify-js' {
  interface SimplifyPoint {
    x: number;
    y: number;
  }
  export default function simplify(
    points: SimplifyPoint[],
    tolerance?: number,
    highQuality?: boolean
  ): SimplifyPoint[];
}
