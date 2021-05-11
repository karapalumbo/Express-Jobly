"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    companyHandle: "c1",
    title: "New",
    salary: 150,
    equity: "0.1",
  };

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
          id: expect.any(Number),
          companyHandle: "c1",
          title: "New",
          salary: 150,
          equity: "0.1",
      },
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "New",
            salary: 150,
            equity: "0",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          title: 5,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
          {
            id: expect.any(Number),
            title: "J1",
            salary: 1,
            equity: "0.1",
            companyHandle: "c1",
            companyName: "C1",
          },
          {
            id: expect.any(Number),
            title: "J2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c1",
            companyName: "C1",
          },
          {
            id: expect.any(Number),
            title: "J3",
            salary: 3,
            equity: null,
            companyHandle: "c1",
            companyName: "C1",
          },
        ],
    });
  });

  test("works: with equity filter", async function () {
    const resp = await request(app)
        .get("/jobs")
        .query({ hasEquity: true });
    expect(resp.body).toEqual({
      jobs: [
          {
            id: expect.any(Number),
            title: "J1",
            salary: 1,
            equity: "0.1",
            companyHandle: "c1",
            companyName: "C1",
          },
          {
            id: expect.any(Number),
            title: "J2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c1",
            companyName: "C1",
          },
      ],
    });
  });

  test("works: with minSalary filter", async function () {
    const resp = await request(app)
        .get("/jobs")
        .query({ minSalary: 2 });
    expect(resp.body).toEqual({
      jobs: [
          {
            id: expect.any(Number),
            title: "J2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c1",
            companyName: "C1",
          },
          {
            id: expect.any(Number),
            title: "J3",
            salary: 3,
            equity: null,
            companyHandle: "c1",
            companyName: "C1",
          },
      ],
    });
  });

    test("works: with title filter", async function () {
    const resp = await request(app)
        .get("/jobs")
        .query({ title: "2" });
    expect(resp.body).toEqual({
      jobs: [
          {
            id: expect.any(Number),
            title: "J2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c1",
            companyName: "C1",
          },
      ],
    });
  });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: testJobIds[0],
        companyHandle: "c1",
        title: "J1",
        salary: 1,
        equity: "0.1",
      },
    });
  });


  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/6`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "J-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "J-new",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          name: "J-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/6`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          handle: "j1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: 5,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${testJobIds[0]}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/7`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
