import { FastifyRequest, FastifyReply } from "fastify";
import { stat } from "fs";
import { Stream } from "stream";
import { ResourceDeleteResponse } from "../../../../services/types";
import { FileServiceAPI } from "../../api";
import Multistream from "multistream";

export class FileController {
  constructor(protected service: FileServiceAPI) {}

  async save(request: FastifyRequest<{ Params: { company_id: string } }>, response: FastifyReply) {
    const data = await request.file();
    const fields: any = request.query;
    const company_id = request.params.company_id;
    this.service.save({ data, fields, company_id });
    response.send();
  }

  async get(
    request: FastifyRequest<{ Params: { company_id: string; id: string } }>,
    response: FastifyReply,
  ) {
    const params = request.params;
    const filename = params.id;
    // TODO: Get the number of chunks for the file
    const chunks = 13;
    var count = 1;

    const self = this;

    async function factory(callback: (err?: Error, stream?: Stream) => {}) {
      if (count > 13) return callback();
      let stream;
      const chunk = `twake/files/${params.company_id}/user_id/${params.id}/chunk${count}`;
      count++;
      try {
        console.log("chunk", chunk);
        stream = await self.service.download(chunk);
      } catch (err) {
        callback(new Error(`No such chunk ${chunk}`));
        return;
      }
      callback(null, stream);
      return;
    }

    response.header("Content-disposition", "attachment; filename=");
    response.type("image/png");
    response.send(new Multistream(factory));

    //new Multistream(factory).pipe(response.raw);
  }

  async delete(request: FastifyRequest<{}>): Promise<ResourceDeleteResponse> {
    return new ResourceDeleteResponse();
  }
}

/*async dl(path: string): Promise<Stream> {
    const outStream = new Stream.Readable();
    outStream.setMaxListeners(20);
    const outWrtieStream = fs.createWriteStream("toto");
    outStream.pipe(outWrtieStream);
    const totalChunk = 13;
    this.recursiveAddChunk(outStream, 1, totalChunk, path);

    return outStream;
  }*/

/*async recursiveAddChunk(outStream: any, chunkNo: number, totalChunk: number, path: string) {
    const chunkStream = await this.service.download(path + "chunk" + chunkNo);
    chunkStream.on("data", (chunk: any) => outStream.push(chunk));
    chunkStream.on("end", () => {
      if (chunkNo >= totalChunk) {
        outStream.on("end", () => {
          console.log("finish");
        });
        console.log("stream: ", outStream);
        console.log("There will be no more data.");
      } else {
        this.recursiveAddChunk(outStream, chunkNo + 1, totalChunk, path);
      }
    });
  }
}*/
//http://localhost:3000/internal/services/files/v1/companies/12345/files/Capture%20d%E2%80%99e%CC%81cran%202021-04-06%20a%CC%80%2020.24.16.png/download
