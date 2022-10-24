import { readFileSync, writeFileSync } from "fs";
import * as process from "process";
import * as readline from "readline";
console.time("start");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const input = process.argv.find(a => a.startsWith("input=")).split("input=")[1];
const output = process.argv.find(a => a.startsWith("output=")).split("output=")[1];
console.log(`input: ${input}\noutput: ${output}`);

const run = input.endsWith(".bf") ? brainfuckToText : textToBrainfuck;

run(input, output).then(() => {
    console.timeEnd("start");
    process.exit();
});


async function brainfuckToText(fileName: string, outputFileName: string) {
    const arr: number[] = [0];
    let pointer: number = 0;
    // reads the file and gets rid of unnecessary characters (characters not being []<>+-., are comments)
    const file = readFileSync(fileName, {encoding: "utf-8"}).replace(/!(\[],\.><+-)/g, "");
    let index: number = 0;
    const output = [];

    async function main() {
        while (index < file.length) index = await compile(index);
        return true;
        async function compile(index: number): Promise<number> {
            if (index < 0) throw new Error('index négatif');
            switch (file.at(index)) {
                case '<':
                    pointer --;
                    return index + 1;
                case '>':
                    pointer ++;
                    return index + 1;
                case '+':
                    if (!arr[pointer]) arr[pointer] = 0;
                    arr[pointer] ++;
                    return index + 1;
                case '-':
                    if (!arr[pointer]) arr[pointer] = 0;
                    arr[pointer] --;
                    return index + 1;
                case '[':
                    return index + 1;
                case ']':
                    if (arr[pointer] <= 0) return index + 1;

                    const str = file.substring(0, index).split("");
                    let nbCrochetFermant = 0;
                    for (let i = str.length-1; i >= 0; i--) {
                        if (str[i] === "]") nbCrochetFermant ++;
                        else if (str[i] === "[") {
                            if (nbCrochetFermant > 0) nbCrochetFermant --;
                            else {
                                return i;
                            }
                        }
                    }
                    throw new Error("missing '['");
                case '.':
                    output.push(arr[pointer]);
                    return index + 1;
                case ',':
                    const run = async (): Promise<number> => new Promise((resolve) => {
                        rl.question(`input for ${index}\n`, a => {
                            resolve(+a);
                        });
                    });
                    let out = NaN;
                    while (isNaN(out)) out = await run();
                    arr[pointer] = out;
                    return index + 1;
                default: return index + 1;
            }
        }
    }

    function getOutput() {
        const res = String.fromCharCode(...output);
        writeFileSync(outputFileName, res);
    }

    await main();
    getOutput();
}


/**
 * recursively adds '+' characters to multiple indexes.
 * was a nightmare to do, and is not event close to how fast the V3 is ;-;
 * @param fileName
 * @param outputFileName
 */
async function textToBrainfuck(fileName: string, outputFileName: string) {
    // file is an array of numbers (each being the ascii code of the letter it represents)
    const file = readFileSync(fileName, {encoding: "utf-8"}).split("").map(l => l.charCodeAt(0));
    let output = "";
    output += addPluses(file, 0).output;
    output += ">>" + file.map(() => '>.').join("");

    /**
     * Takes a number's array. Add <Math.min(array)> '+' characters to each index of the array, then splits the array where every character is completed and starts with every new created arrays
     * @example
     * [62, 32, 40, 90]
     * [30],__ [8,  58]
     *  __, __  __ [50]
     *
     * @param array
     * @param index the array's first letter's position in the global array
     */
    function addPluses(array: number[], index: number): {output: string, indexPosition: number} {
        if (array.length === 0) return {output: "", indexPosition: index};
        const min = Math.min(...array);
        let output = displayLetter(min, false);
        output += "[";
        let after = "";
        for (let i = 0; i < index; i++) {
            output += ">";
            after += "<";
        }
        for (let i = 0; i < array.length; i++) {
            output += ">+";
            after += "<";
        }
        output += after + "-]<<";
        for (let i = 0; i < array.length; i++) array[i] -= min;
        const new_arr = splitArray(array, 0);
        let size = index;
        for (let i = 0; i < new_arr.length; i++) {
            output += addPluses(new_arr[i], size).output;
            size += new_arr[i].length + 1;
        }
        // +++++[>+>+>+<<<-]
        return {output, indexPosition: index};
    }

    function clean(str: string): string {
        const newStr = str.replace("<>", "").replace("><", "");
        if (newStr.length !== str.length) return clean(newStr);
        return newStr;
    }
    function splitArray(arr: any[], like: any): any[][] {
        const array = [[]];
        let index = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === like) {
                array.push([]);
                index ++;
                continue;
            }
            array[index].push(arr[i]);
        }
        return array;
    }
    writeFileSync(outputFileName, clean(output));
}

/**
 * The idea here is to create a list of all used characters like a keyboard and use them as many times as needed
 * @param fileName
 * @param outputFileName
 */
async function textToBrainfuckV3(fileName: string, outputFileName: string) {
    // file is an array of numbers (each being the ascii code of the letter it represents) // basically a char* equivalent
    const file = readFileSync(fileName, {encoding: "utf-8"}).split("").map(l => l.charCodeAt(0));
    let output = "";

    // list of every used characters
    const chars = [];
    for (const char of file) if (!chars.includes(char)) chars.push(char);
    for (const char of chars) {
        output += displayLetter(char, false);
    }
    // cursor is at the last letter's position
    let currentIndex = getIndex(chars.at(-1));

    for (const letter of file) {
        const index = getIndex(letter);
        //negative means go to left; else go to right
        const diff = index - currentIndex;
        for (let i = 0; i < Math.abs(diff); i++) output += diff > 0 ? ">" : "<";
        // prints the letter
        output += ".";
        currentIndex = index;
    }

    writeFileSync(outputFileName, output);


    function getIndex(char) {
        return chars.indexOf(char) * 2;
    }
}

/**
 * every character is rendered thanks to a for loop;
 * @param fileName
 * @param outputFileName
 */
async function textToBrainfuckV2(fileName: string, outputFileName: string) {
    // file is an array of numbers (each being the ascii code of the letter it represents) // basically a char* equivalent
    const file = readFileSync(fileName, {encoding: "utf-8"}).split("").map(l => l.charCodeAt(0));
    let output = "";

    for (const char of file) {
        output += displayLetter(char);
    }

    writeFileSync(outputFileName, output);
}

/**
 * every character is displayed without any for loop
 * @param fileName
 * @param outputFileName
 */
async function textToBrainfuckV1(fileName: string, outputFileName: string) {
    const file = readFileSync(fileName, {encoding: "utf-8"});
    let output = "";

    for (const char of file.split("")) {
        const value = char.charCodeAt(0);
        for (let i = 0; i < value; i++) output += "+";
        output += ".>";
    }
    writeFileSync(outputFileName, output);
}

function divisor(n: number) {
    const root = Math.sqrt(n);
    for (let i = 2; i <= root; i++)
        if (n % i === 0)
            return n / i;
    return 1;
}

function displayLetter(char: number, display = true): string {
    let output = "";
    output += ">";
    const d = divisor(char);
    const other = char / d;
    for (let i = 0; i < d; i++) output += "+";
    output += "[>";
    for (let i = 0; i < other; i++) output += "+";
    output += "<-]";
    output += `>${display ? '.' : ''}`;
    return output;
}