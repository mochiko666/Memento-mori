function add(v1: Vector2D, v2: Vector2D): Vector2D {
  return [v1[0] + v2[0], v1[1] + v2[1]];
}

function subtract(v1: Vector2D, v2: Vector2D): Vector2D {
  return [v1[0] - v2[0], v1[1] - v2[1]];
}

function multiply(v: Vector2D, scalar: number): Vector2D {
  return [v[0] * scalar, v[1] * scalar];
}

function divide(v: Vector2D, scalar: number): Vector2D {
  if (scalar === 0) return v;
  return [v[0] / scalar, v[1] / scalar];
}

function dot(v1: Vector2D, v2: Vector2D): number {
  return v1[0] * v2[0] + v1[1] * v2[1];
}

function cross(v1: Vector2D, v2: Vector2D): number {
  return v1[0] * v2[1] - v1[1] * v2[0];
}

function magnitude(v: Vector2D): number {
  return Math.sqrt(v[0] ** 2 + v[1] ** 2);
}

function normalize(v: Vector2D): Vector2D {
  const mag = magnitude(v);
  if (mag === 0) return [0, 0];
  return [v[0] / mag, v[1] / mag];
}

function distance(v1: Vector2D, v2: Vector2D): number {
  return magnitude(subtract(v1, v2));
}

function angle(v1: Vector2D, v2: Vector2D): number {
  const dotProduct = dot(v1, v2);
  const mag1 = magnitude(v1);
  const mag2 = magnitude(v2);
  if (mag1 === 0 || mag2 === 0) return 0;
  return Math.acos(dotProduct / (mag1 * mag2));
}

function rotate(v: Vector2D, angle: number): Vector2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [v[0] * cos - v[1] * sin, v[0] * sin + v[1] * cos];
}

const Vector2DUtils = {
  add,
  subtract,
  multiply,
  divide,
  dot,
  cross,
  magnitude,
  normalize,
  distance,
  angle,
  rotate,
};

export {
  add,
  angle,
  cross,
  distance,
  divide,
  dot,
  magnitude,
  multiply,
  normalize,
  rotate,
  subtract,
  Vector2DUtils,
};
