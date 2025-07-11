export const COLORS = {
  primary: {
    black: "#000000",
    darkBlack: "#111111",
  },
  secondary: {
    netflixRed: "#E50914",
    darkRed: "#B20710",
  },
  accent: {
    darkGray: "#333333",
    mediumGray: "#555555",
  },
  text: {
    white: "#FFFFFF",
    lightGray: "#E5E5E5",
    mediumGray: "#CCCCCC",
  },
}

export const FILE_TYPES = {
  pdf: { icon: "📄", color: "text-red-400" },
  docx: { icon: "📝", color: "text-blue-400" },
  txt: { icon: "📋", color: "text-green-400" },
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const SUPPORTED_FILE_TYPES = ["pdf", "docx", "txt"]
