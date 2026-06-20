// Rubik's Cube Simulator and Scrambler for Neo Cube

export interface CubeState3x3 {
  U: string[]; // 9 stickers
  D: string[]; // 9 stickers
  L: string[]; // 9 stickers
  R: string[]; // 9 stickers
  F: string[]; // 9 stickers
  B: string[]; // 9 stickers
}

export interface CubeState2x2 {
  U: string[]; // 4 stickers
  D: string[]; // 4 stickers
  L: string[]; // 4 stickers
  R: string[]; // 4 stickers
  F: string[]; // 4 stickers
  B: string[]; // 4 stickers
}

// Default CSS color/names
export const CUBE_COLORS = {
  U: '#ffffff', // White
  D: '#ffda00', // Yellow
  L: '#ff5800', // Orange
  R: '#c41e3a', // Red
  F: '#009e60', // Green
  B: '#0051ba', // Blue
};

export function getInitialCubeState3(): CubeState3x3 {
  return {
    U: Array(9).fill(CUBE_COLORS.U),
    D: Array(9).fill(CUBE_COLORS.D),
    L: Array(9).fill(CUBE_COLORS.L),
    R: Array(9).fill(CUBE_COLORS.R),
    F: Array(9).fill(CUBE_COLORS.F),
    B: Array(9).fill(CUBE_COLORS.B),
  };
}

export function getInitialCubeState2(): CubeState2x2 {
  return {
    U: Array(4).fill(CUBE_COLORS.U),
    D: Array(4).fill(CUBE_COLORS.D),
    L: Array(4).fill(CUBE_COLORS.L),
    R: Array(4).fill(CUBE_COLORS.R),
    F: Array(4).fill(CUBE_COLORS.F),
    B: Array(4).fill(CUBE_COLORS.B),
  };
}

// 3x3x3 Face rotations Helper
function rotateFace3CW(face: string[]): string[] {
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2]
  ];
}

function rotateFace3CCW(face: string[]): string[] {
  return [
    face[2], face[5], face[8],
    face[1], face[4], face[7],
    face[0], face[3], face[6]
  ];
}

// Apply single 3x3x3 move
export function applySingleMove3(state: CubeState3x3, move: string): CubeState3x3 {
  // Clone state to avoid mutations
  const s: CubeState3x3 = {
    U: [...state.U],
    D: [...state.D],
    L: [...state.L],
    R: [...state.R],
    F: [...state.F],
    B: [...state.B],
  };

  const isPrime = move.endsWith("'");
  const isDouble = move.endsWith("2");
  const base = move[0] as keyof CubeState3x3;

  // 1. Rotate the face itself
  if (base === 'U') {
    if (isDouble) { s.U = rotateFace3CW(rotateFace3CW(s.U)); }
    else if (isPrime) { s.U = rotateFace3CCW(s.U); }
    else { s.U = rotateFace3CW(s.U); }
  } else if (base === 'D') {
    if (isDouble) { s.D = rotateFace3CW(rotateFace3CW(s.D)); }
    else if (isPrime) { s.D = rotateFace3CCW(s.D); }
    else { s.D = rotateFace3CW(s.D); }
  } else if (base === 'L') {
    if (isDouble) { s.L = rotateFace3CW(rotateFace3CW(s.L)); }
    else if (isPrime) { s.L = rotateFace3CCW(s.L); }
    else { s.L = rotateFace3CW(s.L); }
  } else if (base === 'R') {
    if (isDouble) { s.R = rotateFace3CW(rotateFace3CW(s.R)); }
    else if (isPrime) { s.R = rotateFace3CCW(s.R); }
    else { s.R = rotateFace3CW(s.R); }
  } else if (base === 'F') {
    if (isDouble) { s.F = rotateFace3CW(rotateFace3CW(s.F)); }
    else if (isPrime) { s.F = rotateFace3CCW(s.F); }
    else { s.F = rotateFace3CW(s.F); }
  } else if (base === 'B') {
    if (isDouble) { s.B = rotateFace3CW(rotateFace3CW(s.B)); }
    else if (isPrime) { s.B = rotateFace3CCW(s.B); }
    else { s.B = rotateFace3CW(s.B); }
  }

  // 2. Adjust adjacent faces
  if (base === 'U') {
    const indices = [0, 1, 2];
    if (isDouble) {
      // Swipe twice
      const tempF = [s.F[0], s.F[1], s.F[2]];
      const tempL = [s.L[0], s.L[1], s.L[2]];
      s.F[0] = s.B[0]; s.F[1] = s.B[1]; s.F[2] = s.B[2];
      s.B[0] = tempF[0]; s.B[1] = tempF[1]; s.B[2] = tempF[2];
      s.L[0] = s.R[0]; s.L[1] = s.R[1]; s.L[2] = s.R[2];
      s.R[0] = tempL[0]; s.R[1] = tempL[1]; s.R[2] = tempL[2];
    } else if (isPrime) {
      // CCW: sliding from Left to Front
      const tempL = [s.L[0], s.L[1], s.L[2]];
      s.L[0] = s.B[0]; s.L[1] = s.B[1]; s.L[2] = s.B[2];
      s.B[0] = s.R[0]; s.B[1] = s.R[1]; s.B[2] = s.R[2];
      s.R[0] = s.F[0]; s.R[1] = s.F[1]; s.R[2] = s.F[2];
      s.F[0] = tempL[0]; s.F[1] = tempL[1]; s.F[2] = tempL[2];
    } else {
      // CW: sliding of top layer L -> B -> R -> F -> L
      const tempL = [s.L[0], s.L[1], s.L[2]];
      s.L[0] = s.F[0]; s.L[1] = s.F[1]; s.L[2] = s.F[2];
      s.F[0] = s.R[0]; s.F[1] = s.R[1]; s.F[2] = s.R[2];
      s.R[0] = s.B[0]; s.R[1] = s.B[1]; s.R[2] = s.B[2];
      s.B[0] = tempL[0]; s.B[1] = tempL[1]; s.B[2] = tempL[2];
    }
  }

  else if (base === 'D') {
    if (isDouble) {
      const tempF = [s.F[6], s.F[7], s.F[8]];
      const tempL = [s.L[6], s.L[7], s.L[8]];
      s.F[6] = s.B[6]; s.F[7] = s.B[7]; s.F[8] = s.B[8];
      s.B[6] = tempF[0]; s.B[7] = tempF[1]; s.B[8] = tempF[2];
      s.L[6] = s.R[6]; s.L[7] = s.R[7]; s.L[8] = s.R[8];
      s.R[6] = tempL[0]; s.R[7] = tempL[1]; s.R[8] = tempL[2];
    } else if (isPrime) {
      // CCW
      const tempL = [s.L[6], s.L[7], s.L[8]];
      s.L[6] = s.F[6]; s.L[7] = s.F[7]; s.L[8] = s.F[8];
      s.F[6] = s.R[6]; s.F[7] = s.R[7]; s.F[8] = s.R[8];
      s.R[6] = s.B[6]; s.R[7] = s.B[7]; s.R[8] = s.B[8];
      s.B[6] = tempL[0]; s.B[7] = tempL[1]; s.B[8] = tempL[2];
    } else {
      // CW
      const tempL = [s.L[6], s.L[7], s.L[8]];
      s.L[6] = s.B[6]; s.L[7] = s.B[7]; s.L[8] = s.B[8];
      s.B[6] = s.R[6]; s.B[7] = s.B[7]; s.B[8] = s.R[8];
      s.R[6] = s.F[6]; s.R[7] = s.F[7]; s.R[8] = s.F[8];
      s.F[6] = tempL[0]; s.F[7] = tempL[1]; s.F[8] = tempL[2];
    }
  }

  else if (base === 'R') {
    // Right affects U[2,5,8], F[2,5,8], D[2,5,8], B[0,3,6] (reversed)
    if (isDouble) {
      const tempU = [s.U[2], s.U[5], s.U[8]];
      s.U[2] = s.D[2]; s.U[5] = s.D[5]; s.U[8] = s.D[8];
      s.D[2] = tempU[0]; s.D[5] = tempU[1]; s.D[8] = tempU[2];

      const tempF = [s.F[2], s.F[5], s.F[8]];
      s.F[2] = s.B[6]; s.F[5] = s.B[3]; s.F[8] = s.B[0];
      s.B[6] = tempF[0]; s.B[3] = tempF[1]; s.B[0] = tempF[2];
    } else if (isPrime) {
      // CCW
      const tempU = [s.U[2], s.U[5], s.U[8]];
      s.U[2] = s.B[6]; s.U[5] = s.B[3]; s.U[8] = s.B[0];
      s.B[6]= s.D[2]; s.B[3]= s.D[5]; s.B[0]= s.D[8];
      s.D[2] = s.F[2]; s.D[5] = s.F[5]; s.D[8] = s.F[8];
      s.F[2] = tempU[0]; s.F[5] = tempU[1]; s.F[8] = tempU[2];
    } else {
      // CW
      const tempU = [s.U[2], s.U[5], s.U[8]];
      s.U[2] = s.F[2]; s.U[5] = s.F[5]; s.U[8] = s.F[8];
      s.F[2] = s.D[2]; s.F[5] = s.D[5]; s.F[8] = s.D[8];
      s.D[2] = s.B[6]; s.D[5] = s.B[3]; s.D[8] = s.B[0];
      s.B[6] = tempU[0]; s.B[3] = tempU[1]; s.B[0] = tempU[2];
    }
  }

  else if (base === 'L') {
    // Left affects U[0,3,6], F[0,3,6], D[0,3,6], B[2,5,8] (reversed)
    if (isDouble) {
      const tempU = [s.U[0], s.U[3], s.U[6]];
      s.U[0] = s.D[0]; s.U[3] = s.D[3]; s.U[6] = s.D[6];
      s.D[0] = tempU[0]; s.D[3] = tempU[1]; s.D[6] = tempU[2];

      const tempF = [s.F[0], s.F[3], s.F[6]];
      s.F[0] = s.B[8]; s.F[3] = s.B[5]; s.F[6] = s.B[2];
      s.B[8] = tempF[0]; s.B[5] = tempF[1]; s.B[2] = tempF[2];
    } else if (isPrime) {
      // CCW
      const tempU = [s.U[0], s.U[3], s.U[6]];
      s.U[0] = s.F[0]; s.U[3] = s.F[3]; s.U[6] = s.F[6];
      s.F[0] = s.D[0]; s.F[3] = s.D[3]; s.F[6] = s.D[6];
      s.D[0] = s.B[8]; s.D[3] = s.B[5]; s.D[6] = s.B[2];
      s.B[8] = tempU[0]; s.B[5] = tempU[1]; s.B[2] = tempU[2];
    } else {
      // CW
      const tempU = [s.U[0], s.U[3], s.U[6]];
      s.U[0] = s.B[8]; s.U[3] = s.B[5]; s.U[6] = s.B[2];
      s.B[8] = s.D[0]; s.B[5] = s.D[3]; s.B[2] = s.D[6];
      s.D[0] = s.F[0]; s.D[3] = s.F[3]; s.D[6] = s.F[6];
      s.F[0] = tempU[0]; s.F[3] = tempU[1]; s.F[6] = tempU[2];
    }
  }

  else if (base === 'F') {
    // Front affects U[6,7,8], R[0,3,6], D[2,1,0] (reversed), L[8,5,2] (reversed)
    if (isDouble) {
      const tempU = [s.U[6], s.U[7], s.U[8]];
      s.U[6] = s.D[2]; s.U[7] = s.D[1]; s.U[8] = s.D[0];
      s.D[2] = tempU[0]; s.D[1] = tempU[1]; s.D[0] = tempU[2];

      const tempL = [s.L[2], s.L[5], s.L[8]];
      s.L[2] = s.R[6]; s.L[5] = s.R[3]; s.L[8] = s.R[0];
      s.R[6] = tempL[0]; s.R[3] = tempL[1]; s.R[0] = tempL[2];
    } else if (isPrime) {
      // CCW
      const tempU = [s.U[6], s.U[7], s.U[8]];
      s.U[6] = s.R[0]; s.U[7] = s.R[3]; s.U[8] = s.R[6];
      s.R[0] = s.D[2]; s.R[3] = s.D[1]; s.R[6] = s.D[0];
      s.D[2] = s.L[8]; s.D[1] = s.L[5]; s.D[0] = s.L[2];
      s.L[8] = tempU[0]; s.L[5] = tempU[1]; s.L[2] = tempU[2];
    } else {
      // CW
      const tempU = [s.U[6], s.U[7], s.U[8]];
      s.U[6] = s.L[8]; s.U[7] = s.L[5]; s.U[8] = s.L[2];
      s.L[8] = s.D[2]; s.L[5] = s.D[1]; s.L[2] = s.D[0];
      s.D[2] = s.R[6]; s.D[1] = s.R[3]; s.D[0] = s.R[0];
      s.R[6] = tempU[2]; s.R[3] = tempU[1]; s.R[0] = tempU[0];
    }
  }

  else if (base === 'B') {
    // Back affects U[0,1,2], L[6,3,0] (reversed), D[8,7,6] (reversed), R[2,5,8]
    if (isDouble) {
      const tempU = [s.U[0], s.U[1], s.U[2]];
      s.U[0] = s.D[8]; s.U[1] = s.D[7]; s.U[2] = s.D[6];
      s.D[8] = tempU[0]; s.D[7] = tempU[1]; s.D[6] = tempU[2];

      const tempL = [s.L[0], s.L[3], s.L[6]];
      s.L[0] = s.R[8]; s.L[3] = s.R[5]; s.L[6] = s.R[2];
      s.R[8] = tempL[0]; s.R[5] = tempL[1]; s.R[2] = tempL[2];
    } else if (isPrime) {
      // CCW
      const tempU = [s.U[0], s.U[1], s.U[2]];
      s.U[0] = s.L[6]; s.U[1] = s.L[3]; s.U[2] = s.L[0];
      s.L[6] = s.D[8]; s.L[3] = s.D[7]; s.L[0] = s.D[6];
      s.D[8] = s.R[2]; s.D[7] = s.R[5]; s.D[6] = s.R[8];
      s.R[2] = tempU[0]; s.R[5] = tempU[1]; s.R[8] = tempU[2];
    } else {
      // CW
      const tempU = [s.U[0], s.U[1], s.U[2]];
      s.U[0] = s.R[2]; s.U[1] = s.R[5]; s.U[2] = s.R[8];
      s.R[2] = s.D[8]; s.R[5] = s.D[7]; s.R[8] = s.D[6];
      s.D[8] = s.L[6]; s.D[7] = s.L[3]; s.D[6] = s.L[0];
      s.L[6] = tempU[0]; s.L[3] = tempU[1]; s.L[0] = tempU[2];
    }
  }

  return s;
}

// Rotate 2x2x2 face CW
function rotateFace2CW(face: string[]): string[] {
  return [face[2], face[0], face[3], face[1]];
}

// Rotate 2x2x2 face CCW
function rotateFace2CCW(face: string[]): string[] {
  return [face[1], face[3], face[0], face[2]];
}

// Apply single 2x2x2 move
export function applySingleMove2(state: CubeState2x2, move: string): CubeState2x2 {
  // Clone
  const s: CubeState2x2 = {
    U: [...state.U],
    D: [...state.D],
    L: [...state.L],
    R: [...state.R],
    F: [...state.F],
    B: [...state.B],
  };

  const isPrime = move.endsWith("'");
  const isDouble = move.endsWith("2");
  const base = move[0] as keyof CubeState2x2;

  // Face rotation
  if (base === 'U') {
    if (isDouble) { s.U = rotateFace2CW(rotateFace2CW(s.U)); }
    else if (isPrime) { s.U = rotateFace2CCW(s.U); }
    else { s.U = rotateFace2CW(s.U); }
  } else if (base === 'D') {
    if (isDouble) { s.D = rotateFace2CW(rotateFace2CW(s.D)); }
    else if (isPrime) { s.D = rotateFace2CCW(s.D); }
    else { s.D = rotateFace2CW(s.D); }
  } else if (base === 'L') {
    if (isDouble) { s.L = rotateFace2CW(rotateFace2CW(s.L)); }
    else if (isPrime) { s.L = rotateFace2CCW(s.L); }
    else { s.L = rotateFace2CW(s.L); }
  } else if (base === 'R') {
    if (isDouble) { s.R = rotateFace2CW(rotateFace2CW(s.R)); }
    else if (isPrime) { s.R = rotateFace2CCW(s.R); }
    else { s.R = rotateFace2CW(s.R); }
  } else if (base === 'F') {
    if (isDouble) { s.F = rotateFace2CW(rotateFace2CW(s.F)); }
    else if (isPrime) { s.F = rotateFace2CCW(s.F); }
    else { s.F = rotateFace2CW(s.F); }
  } else if (base === 'B') {
    if (isDouble) { s.B = rotateFace2CW(rotateFace2CW(s.B)); }
    else if (isPrime) { s.B = rotateFace2CCW(s.B); }
    else { s.B = rotateFace2CW(s.B); }
  }

  // Adjacent shifts simplified for 2x2x2
  if (base === 'U') {
    if (isDouble) {
      const tempF = [s.F[0], s.F[1]];
      const tempL = [s.L[0], s.L[1]];
      s.F[0] = s.B[0]; s.F[1] = s.B[1];
      s.B[0] = tempF[0]; s.B[1] = tempF[1];
      s.L[0] = s.R[0]; s.L[1] = s.R[1];
      s.R[0] = tempL[0]; s.R[1] = tempL[1];
    } else if (isPrime) {
      const tempL = [s.L[0], s.L[1]];
      s.L[0] = s.B[0]; s.L[1] = s.B[1];
      s.B[0] = s.R[0]; s.B[1] = s.R[1];
      s.R[0] = s.F[0]; s.R[1] = s.F[1];
      s.F[0] = tempL[0]; s.F[1] = tempL[1];
    } else {
      const tempL = [s.L[0], s.L[1]];
      s.L[0] = s.F[0]; s.L[1] = s.F[1];
      s.F[0] = s.R[0]; s.F[1] = s.R[1];
      s.R[0] = s.B[0]; s.R[1] = s.B[1];
      s.B[0] = tempL[0]; s.B[1] = tempL[1];
    }
  } else if (base === 'D') {
    if (isDouble) {
      const tempF = [s.F[2], s.F[3]];
      const tempL = [s.L[2], s.L[3]];
      s.F[2] = s.B[2]; s.F[3] = s.B[3];
      s.B[2] = tempF[0]; s.B[3] = tempF[1];
      s.L[2] = s.R[2]; s.L[3] = s.R[3];
      s.R[2] = tempL[0]; s.R[3] = tempL[1];
    } else if (isPrime) {
      const tempL = [s.L[2], s.L[3]];
      s.L[2] = s.F[2]; s.L[3] = s.F[3];
      s.F[2] = s.R[2]; s.F[3] = s.R[3];
      s.R[2] = s.B[2]; s.R[3] = s.B[3];
      s.B[2] = tempL[0]; s.B[3] = tempL[1];
    } else {
      const tempL = [s.L[2], s.L[3]];
      s.L[2] = s.B[2]; s.L[3] = s.B[3];
      s.B[2] = s.R[2]; s.B[3] = s.R[3];
      s.R[2] = s.F[2]; s.R[3] = s.F[3];
      s.F[2] = tempL[0]; s.F[3] = tempL[1];
    }
  } else if (base === 'R') {
    // R layer columns: U[1,3], F[1,3], D[1,3], B[0,2] (reversed)
    if (isDouble) {
      const tempU = [s.U[1], s.U[3]];
      s.U[1] = s.D[1]; s.U[3] = s.D[3];
      s.D[1] = tempU[0]; s.D[3] = tempU[1];

      const tempF = [s.F[1], s.F[3]];
      s.F[1] = s.B[2]; s.F[3] = s.B[0];
      s.B[2] = tempF[0]; s.B[0] = tempF[1];
    } else if (isPrime) {
      const tempU = [s.U[1], s.U[3]];
      s.U[1] = s.B[2]; s.U[3] = s.B[0];
      s.B[2] = s.D[1]; s.B[0] = s.D[3];
      s.D[1] = s.F[1]; s.D[3] = s.F[3];
      s.F[1] = tempU[0]; s.F[3] = tempU[1];
    } else {
      const tempU = [s.U[1], s.U[3]];
      s.U[1] = s.F[1]; s.U[3] = s.F[3];
      s.F[1] = s.D[1]; s.F[3] = s.D[3];
      s.D[1] = s.B[2]; s.D[3] = s.B[0];
      s.B[2] = tempU[0]; s.B[0] = tempU[1];
    }
  } else if (base === 'L') {
    // L layer columns: U[0,2], F[0,2], D[0,2], B[1,3] (reversed)
    if (isDouble) {
      const tempU = [s.U[0], s.U[2]];
      s.U[0] = s.D[0]; s.U[2] = s.D[2];
      s.D[0] = tempU[0]; s.D[2] = tempU[1];

      const tempF = [s.F[0], s.F[2]];
      s.F[0] = s.B[3]; s.F[2] = s.B[1];
      s.B[3] = tempF[0]; s.B[1] = tempF[1];
    } else if (isPrime) {
      const tempU = [s.U[0], s.U[2]];
      s.U[0] = s.F[0]; s.U[2] = s.F[2];
      s.F[0] = s.D[0]; s.F[2] = s.D[2];
      s.D[0] = s.B[3]; s.D[2] = s.B[1];
      s.B[3] = tempU[0]; s.B[1] = tempU[1];
    } else {
      const tempU = [s.U[0], s.U[2]];
      s.U[0] = s.B[3]; s.U[2] = s.B[1];
      s.B[3] = s.D[0]; s.B[1] = s.D[2];
      s.D[0] = s.F[0]; s.D[2] = s.F[2];
      s.F[0] = tempU[0]; s.F[2] = tempU[1];
    }
  } else if (base === 'F') {
    // F layer layers: U[2,3], L[1,3] (reversed), D[1,0] (reversed), R[0,2]
    if (isDouble) {
      const tempU = [s.U[2], s.U[3]];
      s.U[2] = s.D[1]; s.U[3] = s.D[0];
      s.D[1] = tempU[0]; s.D[0] = tempU[1];

      const tempL = [s.L[1], s.L[3]];
      s.L[1] = s.R[2]; s.L[3] = s.R[0];
      s.R[2] = tempL[0]; s.R[0] = tempL[1];
    } else if (isPrime) {
      const tempU = [s.U[2], s.U[3]];
      s.U[2] = s.R[0]; s.U[3] = s.R[2];
      s.R[0] = s.D[1]; s.R[2] = s.D[0];
      s.D[1] = s.L[3]; s.D[0] = s.L[1];
      s.L[3] = tempU[0]; s.L[1] = tempU[1];
    } else {
      const tempU = [s.U[2], s.U[3]];
      s.U[2] = s.L[3]; s.U[3] = s.L[1];
      s.L[3] = s.D[1]; s.L[1] = s.D[0];
      s.D[1] = s.R[2]; s.D[0] = s.R[0];
      s.R[2] = tempU[1]; s.R[0] = tempU[0];
    }
  } else if (base === 'B') {
    // B layer layers: U[0,1], R[1,3], D[3,2] (reversed), L[2,0] (reversed)
    if (isDouble) {
      const tempU = [s.U[0], s.U[1]];
      s.U[0] = s.D[3]; s.U[1] = s.D[2];
      s.D[3] = tempU[0]; s.D[2] = tempU[1];

      const tempL = [s.L[0], s.L[2]];
      s.L[0] = s.R[3]; s.L[2] = s.R[1];
      s.R[3] = tempL[0]; s.R[1] = tempL[2];
    } else if (isPrime) {
      const tempU = [s.U[0], s.U[1]];
      s.U[0] = s.L[2]; s.U[1] = s.L[0];
      s.L[2] = s.D[3]; s.L[0] = s.D[2];
      s.D[3] = s.R[1]; s.D[2] = s.R[3];
      s.R[1] = tempU[0]; s.R[3] = tempU[1];
    } else {
      const tempU = [s.U[0], s.U[1]];
      s.U[0] = s.R[1]; s.U[1] = s.R[3];
      s.R[1] = s.D[3]; s.R[3] = s.D[2];
      s.D[3] = s.L[2]; s.D[2] = s.L[0];
      s.L[2] = tempU[0]; s.L[0] = tempU[1];
    }
  }

  return s;
}

// Generate premium scrambles
export function generateScramble(puzzleType: string): string {
  const moves3x3 = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F', "F'", 'F2', 'B', "B'", 'B2'];
  const moves2x2 = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2'];
  const movesPyraminx = ['U', "U'", 'L', "L'", 'R', "R'", 'B', "B'"];
  const tipsPyraminx = ['u', "u'", 'l', "l'", 'r', "r'", 'b', "b'"];

  const getOpposite = (move: string): string => move[0];

  if (puzzleType === '3x3x3' || puzzleType === 'OH') {
    const sequence: string[] = [];
    let lastFace = '';
    while (sequence.length < 20) {
      const randomMove = moves3x3[Math.floor(Math.random() * moves3x3.length)];
      const face = randomMove[0];
      if (face !== lastFace) {
        sequence.push(randomMove);
        lastFace = face;
      }
    }
    return sequence.join(' ');
  }

  if (puzzleType === '2x2x2') {
    const sequence: string[] = [];
    let lastFace = '';
    while (sequence.length < 11) {
      const randomMove = moves2x2[Math.floor(Math.random() * moves2x2.length)];
      const face = randomMove[0];
      if (face !== lastFace) {
        sequence.push(randomMove);
        lastFace = face;
      }
    }
    return sequence.join(' ');
  }

  if (puzzleType === '4x4x4') {
    const wideMoves = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F', "F'", 'F2', 'B', "B'", 'B2',
                      'Uw', "Uw'", 'Uw2', 'Dw', "Dw'", 'Dw2', 'Rw', "Rw'", 'Rw2', 'Lw', "Lw'", 'Lw2', 'Fw', "Fw'", 'Fw2', 'Bw', "Bw'", 'Bw2'];
    const sequence: string[] = [];
    let lastBase = '';
    while (sequence.length < 40) {
      const randomMove = wideMoves[Math.floor(Math.random() * wideMoves.length)];
      const base = randomMove.replace(/[0-9']/g, '');
      if (base !== lastBase) {
        sequence.push(randomMove);
        lastBase = base;
      }
    }
    return sequence.join(' ');
  }

  if (puzzleType === 'Pyraminx') {
    const sequence: string[] = [];
    let lastFace = '';
    while (sequence.length < 10) {
      const randomMove = movesPyraminx[Math.floor(Math.random() * movesPyraminx.length)];
      const face = randomMove[0];
      if (face !== lastFace) {
        sequence.push(randomMove);
        lastFace = face;
      }
    }
    // Add 1-3 minor tips for maximum authenticity
    const usedTips = new Set<string>();
    const countTips = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < countTips; i++) {
      const tipIndex = Math.floor(Math.random() * tipsPyraminx.length);
      const tip = tipsPyraminx[tipIndex];
      const tipLetter = tip[0];
      if (!usedTips.has(tipLetter)) {
        sequence.push(tip);
        usedTips.add(tipLetter);
      }
    }
    return sequence.join(' ');
  }

  if (puzzleType === 'Megaminx') {
    // Megaminx uses standard notation format: (R++ D++ or R-- D--) x 10, then a U/U' finish, done for 3 lines
    const lines: string[] = [];
    for (let line = 0; line < 3; line++) {
      const lineSteps: string[] = [];
      for (let i = 0; i < 7; i++) {
        const rSign = Math.random() > 0.5 ? 'R++' : 'R--';
        const dSign = Math.random() > 0.5 ? 'D++' : 'D--';
        lineSteps.push(rSign, dSign);
      }
      const uSuffix = Math.random() > 0.5 ? "U" : "U'";
      lineSteps.push(uSuffix);
      lines.push(lineSteps.join(' '));
    }
    return lines.join('\n');
  }

  // --- Skewb ---
  if (puzzleType === 'Skewb') {
    const skewbMoves = ['R', "R'", 'L', "L'", 'U', "U'", 'B', "B'"];
    const seq: string[] = [];
    let last = '';
    while (seq.length < 11) {
      const m = skewbMoves[Math.floor(Math.random() * skewbMoves.length)];
      if (m[0] !== last) { seq.push(m); last = m[0]; }
    }
    return seq.join(' ');
  }


  if (puzzleType === '5x5x5') {
    const w5 = ['U',"U'","U2",'D',"D'","D2",'R',"R'","R2",'L',"L'","L2",'F',"F'","F2",'B',"B'","B2",
                'Uw',"Uw'","Uw2",'Dw',"Dw'","Dw2",'Rw',"Rw'","Rw2",'Lw',"Lw'","Lw2",'Fw',"Fw'","Fw2",'Bw',"Bw'","Bw2",
                '3Uw',"3Uw'","3Uw2",'3Rw',"3Rw'","3Rw2",'3Fw',"3Fw'","3Fw2"];
    const seq: string[] = []; let lastBase = '';
    while (seq.length < 60) {
      const m = w5[Math.floor(Math.random() * w5.length)];
      const base = m.replace(/[^A-Za-z]/g,'');
      if (base !== lastBase) { seq.push(m); lastBase = base; }
    }
    return seq.join(' ');
  }

  if (puzzleType === '6x6x6') {
    const w6 = ['U',"U'","U2",'D',"D'","D2",'R',"R'","R2",'L',"L'","L2",'F',"F'","F2",'B',"B'","B2",
                'Uw',"Uw'","Uw2",'Dw',"Dw'","Dw2",'Rw',"Rw'","Rw2",'Lw',"Lw'","Lw2",'Fw',"Fw'","Fw2",'Bw',"Bw'","Bw2",
                '3Uw',"3Uw'","3Uw2",'3Rw',"3Rw'","3Rw2",'4Uw',"4Uw'","4Uw2",'4Rw',"4Rw'","4Rw2"];
    const seq: string[] = []; let lastBase = '';
    while (seq.length < 80) {
      const m = w6[Math.floor(Math.random() * w6.length)];
      const base = m.replace(/[^A-Za-z]/g,'');
      if (base !== lastBase) { seq.push(m); lastBase = base; }
    }
    return seq.join(' ');
  }

  if (puzzleType === '7x7x7') {
    const w7 = ['U',"U'","U2",'D',"D'","D2",'R',"R'","R2",'L',"L'","L2",'F',"F'","F2",'B',"B'","B2",
                'Uw',"Uw'","Uw2",'Dw',"Dw'","Dw2",'Rw',"Rw'","Rw2",'Lw',"Lw'","Lw2",'Fw',"Fw'","Fw2",'Bw',"Bw'","Bw2",
                '3Uw',"3Uw'","3Uw2",'3Rw',"3Rw'","3Rw2",'4Uw',"4Uw'","4Uw2",'4Rw',"4Rw'","4Rw2",'5Uw',"5Uw'","5Uw2"];
    const seq: string[] = []; let lastBase = '';
    while (seq.length < 100) {
      const m = w7[Math.floor(Math.random() * w7.length)];
      const base = m.replace(/[^A-Za-z]/g,'');
      if (base !== lastBase) { seq.push(m); lastBase = base; }
    }
    return seq.join(' ');
  }

  if (puzzleType === 'Square-1') {
    const parts: string[] = [];
    for (let i = 0; i < 9; i++) {
      const top = Math.floor(Math.random() * 13) - 6;
      const bot = Math.floor(Math.random() * 13) - 6;
      parts.push('(' + top + ',' + bot + ')');
      if (i < 8) parts.push('/');
    }
    return parts.join(' ');
  }

  if (puzzleType === 'Clock') {
    const pinNames = ['UL','UR','DL','DR'];
    const hands = ['UR','DR','DL','UL','U','R','D','L','ALL'];
    const pins = pinNames.map(() => Math.random() > 0.5 ? 'd' : 'u').join('');
    const moves = hands.map(h => h + (Math.floor(Math.random()*12)+1) + '+');
    return pins + ' ' + moves.join(' ');
  }

  if (puzzleType === 'BLD') {
    const bldMoves = ['U',"U'","U2",'D',"D'","D2",'R',"R'","R2",'L',"L'","L2",'F',"F'","F2",'B',"B'","B2"];
    const sequence: string[] = [];
    let lastFace = '';
    while (sequence.length < 20) {
      const m = bldMoves[Math.floor(Math.random() * bldMoves.length)];
      if (m[0] !== lastFace) { sequence.push(m); lastFace = m[0]; }
    }
    return sequence.join(' ');
  }

  return "R2 F2 U' L2 U R2 D B2 U2 R2 B' U2 L' B' D B2 R D' F'";
}

// ── WCA event ID map for cubing.js ────────────────────────────────────────────
export const WCA_EVENT_MAP: Record<string, string> = {
  '3x3x3':   '333',
  '2x2x2':   '222',
  '4x4x4':   '444',
  '5x5x5':   '555',
  '6x6x6':   '666',
  '7x7x7':   '777',
  'OH':       '333oh',
  'BLD':      '333bf',
  'Pyraminx': 'pyram',
  'Megaminx': 'minx',
  'Skewb':    'skewb',
  'Square-1': 'sq1',
  'Clock':    'clock',
};

/**
 * Async scramble generation using cubing.js (WCA random-state).
 * Falls back to the synchronous custom generator on error or SSR.
 */
export async function generateScrambleAsync(puzzleType: string): Promise<string> {
  if (typeof window === 'undefined') return generateScramble(puzzleType);
  try {
    const { randomScrambleForEvent } = await import('cubing/scramble');
    const eventId = WCA_EVENT_MAP[puzzleType] ?? '333';
    const alg = await randomScrambleForEvent(eventId);
    return alg.toString();
  } catch {
    return generateScramble(puzzleType);
  }
}
