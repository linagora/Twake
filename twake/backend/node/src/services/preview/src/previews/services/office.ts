const unoconv = require("unoconv-promise");

export async function convertFromOffice(
  inputPath: string,
  outputPath: string,
  numberOfPages: number,
) {
  if (numberOfPages >= 1) {
    const processOutputPath = outputPath.split("/");
    processOutputPath.pop();
    processOutputPath.push("tmp");
    outputPath = `${processOutputPath.join("/")}/${outputPath.split("/").pop()}`;
    await unoconv
      .run({
        file: inputPath,
        output: `${outputPath}`,
        export: `PageRange=1-${numberOfPages}`,
      })
      .catch((e: any) => {
        throw e;
      });

    return `${outputPath}.pdf`;
  }
}
