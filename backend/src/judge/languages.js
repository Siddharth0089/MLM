export const LANG = {
  cpp: {
    file: "main.cpp",
    compile: "g++ main.cpp -O2 -std=c++17 -o main",
    run: "./main"
  },
  java: {
    file: "Main.java",
    compile: "javac Main.java",
    run: "java Main"
  },
  js: {
    file: "main.js",
    compile: null,
    run: "node main.js"
  }
};
