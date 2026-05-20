/**
 * Synapse Animation Data (ORIGINS)
 * 
 * [ Property 속성 설명 ]
 * id          : 다발의 고유 식별자 (제너레이터 전용)
 * ox, oy, oz  : 다발이 시작되는 3D 공간의 시작점 좌표
 * originR     : 시작점(발원지)의 둥근 원형 크기
 * cpDistRatio : 블랙홀로 빨려갈 때 궤적(베지어 곡선)이 꺾이는 비율 (0~1)
 * cpJitterT/P : 궤적의 비틀림 정도. 일직선이 아닌 유기적으로 꼬불거리는 움직임을 만듦
 * spread      : 묶음 안에서 파티클들이 좌우로 퍼져서 날아가는 반경
 * baseAlpha   : 다발의 고유(태생적) 투명도. 다발마다 진하기를 다르게 하여 입체감을 줌 (0~1)
 * densityMul  : 렌더링 시 선명도 배수 
 * ptsCount    : 이 다발 안에 포함된 파티클(점)의 개수
 */

// prettier-ignore
const ORIGINS = [
  { "id":  "B0", "ox":  321, "oy":  389, "oz": -105, "originR": 15, "cpDistRatio": 0.41, "cpJitterT":  0.15, "cpJitterP":  0.27, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id":  "B1", "ox": -113, "oy": -162, "oz": -214, "originR": 21, "cpDistRatio": 0.41, "cpJitterT":  0.29, "cpJitterP": -0.18, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id":  "B2", "ox":  136, "oy":  408, "oz": -428, "originR": 25, "cpDistRatio": 0.33, "cpJitterT": -0.27, "cpJitterP":  0.08, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id":  "B3", "ox": -608, "oy":  100, "oz":  260, "originR": 18, "cpDistRatio": 0.57, "cpJitterT":  0.36, "cpJitterP": -0.14, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id":  "B4", "ox": -324, "oy":  403, "oz": -434, "originR": 14, "cpDistRatio": 0.34, "cpJitterT":  0.01, "cpJitterP": -0.21, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id":  "B5", "ox":  -79, "oy":   10, "oz": -424, "originR": 24, "cpDistRatio": 0.42, "cpJitterT":  0.35, "cpJitterP":  0.08, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id":  "B6", "ox":  291, "oy":  -20, "oz": -106, "originR": 15, "cpDistRatio": 0.41, "cpJitterT":  -0.2, "cpJitterP":  0.24, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id":  "B7", "ox": -411, "oy":  -46, "oz":  175, "originR": 13, "cpDistRatio": 0.58, "cpJitterT":  0.08, "cpJitterP":  0.01, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id":  "B8", "ox":    2, "oy":  228, "oz":  127, "originR": 24, "cpDistRatio": 0.51, "cpJitterT": -0.12, "cpJitterP": -0.29, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id":  "B9", "ox": -399, "oy":  432, "oz":  178, "originR": 20, "cpDistRatio":  0.6, "cpJitterT":  -0.1, "cpJitterP":  -0.3, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B10", "ox": -126, "oy":  308, "oz":    8, "originR": 15, "cpDistRatio":  0.4, "cpJitterT": -0.05, "cpJitterP":  0.28, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B11", "ox": -266, "oy": -155, "oz":  110, "originR": 18, "cpDistRatio": 0.46, "cpJitterT":  0.36, "cpJitterP": -0.11, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B12", "ox": -299, "oy":  317, "oz": -238, "originR": 13, "cpDistRatio": 0.31, "cpJitterT": -0.36, "cpJitterP": -0.25, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B13", "ox":   77, "oy": -164, "oz": -284, "originR": 19, "cpDistRatio": 0.49, "cpJitterT":  0.22, "cpJitterP":   0.1, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B14", "ox": -396, "oy": -258, "oz":   93, "originR": 22, "cpDistRatio": 0.34, "cpJitterT":  0.18, "cpJitterP":  0.16, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B15", "ox":   99, "oy": -307, "oz":  194, "originR": 15, "cpDistRatio": 0.33, "cpJitterT": -0.28, "cpJitterP": -0.09, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B16", "ox": -398, "oy":  111, "oz":   11, "originR": 16, "cpDistRatio": 0.39, "cpJitterT":  0.08, "cpJitterP": -0.23, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B17", "ox":  378, "oy":  227, "oz": -278, "originR": 14, "cpDistRatio": 0.57, "cpJitterT": -0.37, "cpJitterP": -0.24, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B18", "ox":  -39, "oy": -199, "oz": -414, "originR": 16, "cpDistRatio": 0.46, "cpJitterT":  -0.3, "cpJitterP":  0.01, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B19", "ox":  347, "oy":   57, "oz": -276, "originR": 15, "cpDistRatio":  0.6, "cpJitterT": -0.03, "cpJitterP": -0.25, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B20", "ox": -178, "oy": -273, "oz":  138, "originR": 14, "cpDistRatio": 0.47, "cpJitterT":  -0.1, "cpJitterP": -0.04, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B21", "ox": -353, "oy":  -75, "oz": -316, "originR": 14, "cpDistRatio": 0.46, "cpJitterT":  0.19, "cpJitterP": -0.17, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B22", "ox":  107, "oy": -236, "oz":  315, "originR": 20, "cpDistRatio": 0.38, "cpJitterT": -0.24, "cpJitterP": -0.12, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B23", "ox": -372, "oy":  177, "oz":   21, "originR": 23, "cpDistRatio": 0.56, "cpJitterT":  0.17, "cpJitterP": -0.14, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B24", "ox":  111, "oy":  160, "oz": -334, "originR": 14, "cpDistRatio": 0.55, "cpJitterT":  0.13, "cpJitterP":  0.17, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B25", "ox": -186, "oy": -162, "oz":  342, "originR": 25, "cpDistRatio": 0.36, "cpJitterT": -0.26, "cpJitterP":  0.25, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B26", "ox":  276, "oy":  -85, "oz": -240, "originR": 16, "cpDistRatio": 0.54, "cpJitterT": -0.02, "cpJitterP":  0.25, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B27", "ox":  278, "oy": -245, "oz": -122, "originR": 18, "cpDistRatio":  0.3, "cpJitterT": -0.07, "cpJitterP":  0.23, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B28", "ox":  423, "oy": -305, "oz":  336, "originR": 20, "cpDistRatio": 0.36, "cpJitterT": -0.18, "cpJitterP":  0.06, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B29", "ox": -323, "oy":  133, "oz":  118, "originR": 23, "cpDistRatio": 0.31, "cpJitterT": -0.12, "cpJitterP": -0.17, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B30", "ox":  199, "oy": -481, "oz":  157, "originR": 12, "cpDistRatio": 0.34, "cpJitterT":  -0.1, "cpJitterP": -0.18, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B31", "ox": -136, "oy": 1198, "oz":  -61, "originR": 13, "cpDistRatio": 0.48, "cpJitterT":  0.38, "cpJitterP": -0.27, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B32", "ox": -204, "oy":  284, "oz":  -72, "originR": 20, "cpDistRatio": 0.48, "cpJitterT":  0.03, "cpJitterP": -0.06, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B33", "ox":  100, "oy":  386, "oz": -291, "originR": 18, "cpDistRatio": 0.48, "cpJitterT":  0.29, "cpJitterP": -0.03, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B34", "ox": -172, "oy":  199, "oz":  119, "originR": 12, "cpDistRatio": 0.54, "cpJitterT":  0.04, "cpJitterP":  0.04, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 },
  { "id": "B35", "ox": -274, "oy":  102, "oz": -191, "originR": 19, "cpDistRatio": 0.32, "cpJitterT":  0.09, "cpJitterP": -0.17, "spread": 30, "baseAlpha": 0.5, "densityMul": 2, "ptsCount": 50 }
];
