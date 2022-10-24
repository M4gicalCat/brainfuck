# Brainfuck interpreter and translater

Give that program an input and output file. 
If the input file ends with `.bf`, it will read the file as a brainfuck program and run it.
Otherwise, it will take that file and translate it into a brainfuck program.

You can basically run the program with its output, as I did with the `txt_to_txt` and `bf_to_bf` scripts;

## Running the program
You need to have typescript's compiler, [tsc](https://www.typescriptlang.org/download) installed.
```shell
# from brainfuck to text
npm run run input=yourInputFile.bf output=yourOutputFile.txt

# from text to brainfuck
npm run run input=yourInputFile.txt output=yourOutputFile.bf

# reads from `main.bf` and outputs to `out.bf`
npm run bf_to_bf

# reads from `main.txt` and outputs to `out.txt`
npm run txt_to_txt
```

### different versions
I created different versions of the translater (text -> bf), as I was continuously thinking of better ways to translate text to brainfuck.
Most recent versions are faster and create smaller files. Or at least they should.

## Enjoy