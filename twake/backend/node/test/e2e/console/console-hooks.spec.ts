import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService, uuid } from "../utils.prepare.db";
import { v1 as uuidv1 } from "uuid";
import crypto from "crypto";

describe("The console API hooks", () => {
  const url = "/internal/services/console/v1/hook";

  let platform: TestPlatform;

  const secret = "12345678";

  beforeAll(async ends => {
    platform = await init({
      services: ["database", "pubsub", "webserver", "user", "workspaces", "auth", "console"],
    });
    ends();
  });

  afterAll(async ends => {
    await platform.tearDown();
    ends();
  });

  const getPayload = (type: string, content: Record<any, any>) => {
    const data = {
      content: content,
      type: type,
    } as any;

    const sign = crypto.sign(
      "RSA-SHA512",
      Buffer.from(JSON.stringify(data)),
      "-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQD15kALIEHoe1bt\nADG/oOqHLRgnzNoiGl8aQ6LD/9c4F5+IVP9gPxGm26haSMW2Z9doJeTucvV8syQV\nbdwc9z0NUhNhFG1RLsj0+ePgpuBfKv+uzEICrRedP7wsmWC37K1NmGZ+LzO21oeu\nLO0L39kNk+qspJnqqx8PIfUmeQ6DDkEKW/J0ISeOsBOetKiJC2n5F4Fkifh1Bq2T\nsFfW9Tz47hfLAKkNUyoulBbqX/xViUhlhFb59sxhoMesCL/VJf7OmTLvryXBW/TU\nCYFssAZXXSWOOzc2k+X2VX3QslKfCHsnCO75I+FPFd9YtFWKlaHeq36ZHlYxnYqp\nRcdixzhjAgMBAAECggEANtvoe9L1gUVLDlLVxnfC+udflTmJjMQvZW+jd3Czdisn\nB0ZXNwS7DmvA8mt72IbwMqcJnPz+sZRRv4oj6j5qW3dtJWJmRQ9X+/doFG2GbxTr\nt/aP34L4WremZpjNUBs4SrBuZUZolijkWkJhnB2Tkgjm+R87y3Pj2P9tbujhCPGM\nMQf+s5lOh/AXDyqYGyEJAZBJT3DevrB9Cl3uhYWZ0fFUz4hwATeB0Va8YT8ZJea2\nXwajg/NnOOpdSGVgv0+7zhPYvkvg8bMZeH24VxYkAfdww8vANPuk4wUwDvnh39+Q\nI4uHQGXgjf8SJ5Z7G7A5Q4r7Ma4drJDbCOfNTi84+QKBgQD+ar48b7c5ffMT/ta7\nGUfMiHCjLfauHt/1f1CkFN1OpJW2ZrS34jYusqBXos32X2gx+wsOGtzOrhkkpvgp\nL7jaZmUnQTwfn6Sx4Duq+LVVMH/uj+W/Zj24AKnoylzM9XC6D2kwKAfHs4Mg6+fe\no6VRBR/yw01ShR+YDVAEN0B7ZwKBgQD3bfCIlp1DpTjFKEBFaC4jRNJPaf8OLt/U\nYHOBwwltb406I4s13M3A1N74Btk5ycx6n/a6RHIGB6+E2xn9AnYI51M/+n9vBLPc\nnnqjOZP/7FdK7qL/g4JtXae/CyroXYaYXUNsdJttQC62QRW+xhp6fYxWt/nAcc9R\nvXmninx5pQJ/CPG3vmgvCNZktU9APVOmMoqZayMyiOyM8xSGwT36ick/eioiMFTD\nkuC0wl/23bJ890TcHqLTIHD+cUttbgU/em4fIEIq2vHB2H8JmfkkZtpNpRVp/lCZ\n2t4rGwQCPzJhxCjGiereWyb0dTPV8v3N0gtcFCzJix0i/zV4mq1WlwKBgGfV1F6N\nznun57YdmTNHcC1O4W+ATRA3rakjvPWU0u0BJmRirDYzbolhDB1MSncM7+n6HYG3\n3Z4YNZlslXBvSveblH1B8560e4K3Y0IClNCO72c71F2kY+Tfq9jpp90R+r0QTo5C\nNUPY7oF/uM9xtYT4ESAHXyFa4aUs/dPIs0odAoGBAKYqeAsbLIsb2ruMkeH5itbe\nxdgVHZ8d2Pxk1h+52SGyptuBzlt7c6Gb3KNxpIc61tZklOn5yj+QmJHN82rXGdIE\nCkdrkEmqZU52X2OInozV1Py8L7akH9wijzy5ULWqxapIE2ItnPkgcC7+x6vglkfd\nI0VcGHm8cgqCpzRaIZjH\n-----END PRIVATE KEY-----",
    );

    data.signature = sign.toString("base64");

    return data;
  };

  describe("Company related hooks", () => {
    describe("Common checks", () => {
      it("should 404 when not POST ", async done => {
        const response = await platform.app.inject({
          method: "GET",
          url: `${url}`,
        });
        expect(response.statusCode).toBe(404);
        done();
      });

      it("should 400 when secret key is missing", async done => {
        const response = await platform.app.inject({
          method: "POST",
          url: `${url}`,
          payload: getPayload("a", {}),
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          statusCode: 400,
          error: "Bad Request",
          message: "querystring should have required property 'secret'",
        });
        done();
      });

      it("should 403 when secret key is not valid ", async done => {
        const response = await platform.app.inject({
          method: "POST",
          url: `${url}?secret=wrongOne`,
          payload: getPayload("a", {}),
        });
        expect(response.statusCode).toBe(403);
        expect(response.json()).toMatchObject({
          statusCode: 403,
          error: "Forbidden",
          message: "Wrong secret",
        });
        done();
      });

      it("should 501 when type is not implemented", async done => {
        const response = await platform.app.inject({
          method: "POST",
          url: `${url}?secret=${secret}`,
          payload: getPayload("unknown_type", {}),
        });
        expect(response.statusCode).toBe(501);
        done();
      });
    });

    describe("Company added", () => {
      it("Mock", async done => {
        done();
      });
    });

    describe("Company updated", () => {
      it("Mock", async done => {
        done();
      });
    });

    describe("Company removed", () => {
      it("Mock", async done => {
        done();
      });
    });

    describe("Plan updated", () => {
      it("Mock", async done => {
        done();
      });
    });
  });

  describe("User related hooks", () => {
    describe("User added", () => {
      it("Mock", async done => {
        done();
      });
    });

    describe("User updated", () => {
      it.only("should 200 when user added", async done => {
        const response = await platform.app.inject({
          method: "POST",
          url: `${url}?secret=${secret}`,
          payload: getPayload("company_user_added", {}),
        });
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    describe("User removed", () => {
      it("Mock", async done => {
        done();
      });
    });
  });
});
