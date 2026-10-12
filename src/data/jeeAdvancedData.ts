// JEE Advanced Marks vs Rank Data
export interface JeeAdvancedData {
  year: number;
  paper: string;
  rankData: {
    rank: number;
    general: number;
    obc: number;
    ews: number;
    sc: number;
    st: number;
  }[];
}

export const jeeAdvancedData: JeeAdvancedData[] = [
  {
    year: 2024,
    paper: "Paper 1 + Paper 2",
    rankData: [
      { rank: 1, general: 355, obc: 350, ews: 352, sc: 330, st: 320 },
      { rank: 10, general: 348, obc: 343, ews: 345, sc: 323, st: 313 },
      { rank: 50, general: 335, obc: 330, ews: 332, sc: 310, st: 300 },
      { rank: 100, general: 325, obc: 320, ews: 322, sc: 300, st: 290 },
      { rank: 500, general: 300, obc: 295, ews: 297, sc: 275, st: 265 },
      { rank: 1000, general: 280, obc: 275, ews: 277, sc: 255, st: 245 },
      { rank: 2000, general: 260, obc: 255, ews: 257, sc: 235, st: 225 },
      { rank: 5000, general: 230, obc: 225, ews: 227, sc: 205, st: 195 },
      { rank: 10000, general: 200, obc: 195, ews: 197, sc: 175, st: 165 },
      { rank: 20000, general: 170, obc: 165, ews: 167, sc: 145, st: 135 },
    ]
  },
  {
    year: 2023,
    paper: "Paper 1 + Paper 2",
    rankData: [
      { rank: 1, general: 352, obc: 347, ews: 349, sc: 327, st: 317 },
      { rank: 10, general: 345, obc: 340, ews: 342, sc: 320, st: 310 },
      { rank: 50, general: 332, obc: 327, ews: 329, sc: 307, st: 297 },
      { rank: 100, general: 322, obc: 317, ews: 319, sc: 297, st: 287 },
      { rank: 500, general: 297, obc: 292, ews: 294, sc: 272, st: 262 },
      { rank: 1000, general: 277, obc: 272, ews: 274, sc: 252, st: 242 },
      { rank: 2000, general: 257, obc: 252, ews: 254, sc: 232, st: 222 },
      { rank: 5000, general: 227, obc: 222, ews: 224, sc: 202, st: 192 },
      { rank: 10000, general: 197, obc: 192, ews: 194, sc: 172, st: 162 },
      { rank: 20000, general: 167, obc: 162, ews: 164, sc: 142, st: 132 },
    ]
  },
  {
    year: 2022,
    paper: "Paper 1 + Paper 2",
    rankData: [
      { rank: 1, general: 348, obc: 343, ews: 345, sc: 323, st: 313 },
      { rank: 10, general: 341, obc: 336, ews: 338, sc: 316, st: 306 },
      { rank: 50, general: 328, obc: 323, ews: 325, sc: 303, st: 293 },
      { rank: 100, general: 318, obc: 313, ews: 315, sc: 293, st: 283 },
      { rank: 500, general: 293, obc: 288, ews: 290, sc: 268, st: 258 },
      { rank: 1000, general: 273, obc: 268, ews: 270, sc: 248, st: 238 },
      { rank: 2000, general: 253, obc: 248, ews: 250, sc: 228, st: 218 },
      { rank: 5000, general: 223, obc: 218, ews: 220, sc: 198, st: 188 },
      { rank: 10000, general: 193, obc: 188, ews: 190, sc: 168, st: 158 },
      { rank: 20000, general: 163, obc: 158, ews: 160, sc: 138, st: 128 },
    ]
  },
  {
    year: 2021,
    paper: "Paper 1 + Paper 2",
    rankData: [
      { rank: 1, general: 345, obc: 340, ews: 342, sc: 320, st: 310 },
      { rank: 10, general: 338, obc: 333, ews: 335, sc: 313, st: 303 },
      { rank: 50, general: 325, obc: 320, ews: 322, sc: 300, st: 290 },
      { rank: 100, general: 315, obc: 310, ews: 312, sc: 290, st: 280 },
      { rank: 500, general: 290, obc: 285, ews: 287, sc: 265, st: 255 },
      { rank: 1000, general: 270, obc: 265, ews: 267, sc: 245, st: 235 },
      { rank: 2000, general: 250, obc: 245, ews: 247, sc: 225, st: 215 },
      { rank: 5000, general: 220, obc: 215, ews: 217, sc: 195, st: 185 },
      { rank: 10000, general: 190, obc: 185, ews: 187, sc: 165, st: 155 },
      { rank: 20000, general: 160, obc: 155, ews: 157, sc: 135, st: 125 },
    ]
  },
  {
    year: 2020,
    paper: "Paper 1 + Paper 2",
    rankData: [
      { rank: 1, general: 342, obc: 337, ews: 339, sc: 317, st: 307 },
      { rank: 10, general: 335, obc: 330, ews: 332, sc: 310, st: 300 },
      { rank: 50, general: 322, obc: 317, ews: 319, sc: 297, st: 287 },
      { rank: 100, general: 312, obc: 307, ews: 309, sc: 287, st: 277 },
      { rank: 500, general: 287, obc: 282, ews: 284, sc: 262, st: 252 },
      { rank: 1000, general: 267, obc: 262, ews: 264, sc: 242, st: 232 },
      { rank: 2000, general: 247, obc: 242, ews: 244, sc: 222, st: 212 },
      { rank: 5000, general: 217, obc: 212, ews: 214, sc: 192, st: 182 },
      { rank: 10000, general: 187, obc: 182, ews: 184, sc: 162, st: 152 },
      { rank: 20000, general: 157, obc: 152, ews: 154, sc: 132, st: 122 },
    ]
  },
  {
    year: 2019,
    paper: "Paper 1 + Paper 2",
    rankData: [
      { rank: 1, general: 339, obc: 334, ews: 336, sc: 314, st: 304 },
      { rank: 10, general: 332, obc: 327, ews: 329, sc: 307, st: 297 },
      { rank: 50, general: 319, obc: 314, ews: 316, sc: 294, st: 284 },
      { rank: 100, general: 309, obc: 304, ews: 306, sc: 284, st: 274 },
      { rank: 500, general: 284, obc: 279, ews: 281, sc: 259, st: 249 },
      { rank: 1000, general: 264, obc: 259, ews: 261, sc: 239, st: 229 },
      { rank: 2000, general: 244, obc: 239, ews: 241, sc: 219, st: 209 },
      { rank: 5000, general: 214, obc: 209, ews: 211, sc: 189, st: 179 },
      { rank: 10000, general: 184, obc: 179, ews: 181, sc: 159, st: 149 },
      { rank: 20000, general: 154, obc: 149, ews: 151, sc: 129, st: 119 },
    ]
  },
];
