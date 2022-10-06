// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");


let comp;
let inv;
beforeEach(async function () {
    let cRes = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ($1,$2,$3)
    RETURNING *
    `, ["test", "testCompany", "This is a test Company"]);
    let iRes = await db.query(`
    INSERT INTO invoices (comp_code, amt)
    VALUES($1,$2)
    RETURNING *
    `, ["test", 1000]);
    comp = cRes.rows[0];
    inv = iRes.rows[0];
});

afterEach(async function () {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);
});

afterAll(async function () {
    await db.end();
});

describe("GET /companies", function () {
    test("gets the list of companies", async function () {
        const res = await request(app).get('/companies');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [comp] });
    });
});

describe("GET /invoices", function () {
    test("gets the list of invoices", async function () {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);
        //toEqual doesn't like the date, so we're just checking the id
        expect(res.body.invoices[0].id).toEqual(inv.id);
    });
});

describe("GET /companies/:code", function () {
    test("gets a single company", async function () {
        const res = await request(app).get(`/companies/${comp.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.company.name).toEqual(comp.name);
        expect(res.body.company.invoices[0].id).toEqual(inv.id);
    });

    test("404 response on invalid code", async function () {
        const res = await request(app).get(`/companies/0`);
        expect(res.statusCode).toBe(404);
    });
});

describe("GET /invoices/:id", function () {
    test("gets a single invoice", async function () {
        const res = await request(app).get(`/invoices/${inv.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.invoice.amt).toEqual(inv.amt);
        expect(res.body.invoice.company.code).toEqual(comp.code);
    });

    test("404 response on invalid id", async function () {
        const res = await request(app).get(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    });
});

describe("POST /companies", function () {
    test("create a company", async function () {
        const newComp = {
            code: "test2",
            name: "Second test Company",
            description: "This is the second test company"
        }
        const res = await request(app).post(`/companies`).send(newComp);
        expect(res.statusCode).toBe(201);
        expect(res.body.company).toEqual(newComp);
    });

    test("400 response on missing body requirements", async function () {
        const res = await request(app).post(`/companies`);
        expect(res.statusCode).toBe(400);
    });
});

describe("POST /invoices", function () {
    test("create an invoice", async function () {
        const res = await request(app).post(`/invoices`).send({ comp_code: "test", amt: 1 });
        expect(res.statusCode).toBe(201);
        expect(res.body.invoice.comp_code).toEqual("test");
        expect(res.body.invoice.amt).toEqual(1);
    });

    test("400 response on missing body requirements", async function () {
        const res = await request(app).post(`/invoices`);
        expect(res.statusCode).toBe(400);
    });
});

describe("PUT /companies/:code", function () {
    test("edit a company", async function () {
        const res = await request(app).put(`/companies/${comp.code}`).send({
            name: "new name",
            description: "new description"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.company.name).toEqual("new name");
        expect(res.body.company.description).toEqual("new description");
    });

    test("404 response on invalid code", async function () {
        const res = await request(app).put(`/companies/0`).send({
            name: "new name",
            description: "new description"
        });
        expect(res.statusCode).toBe(404);
    });

    test("400 response on missing body requirements", async function () {
        const res = await request(app).put(`/companies/0`);
        expect(res.statusCode).toBe(400);
    });
});

describe("PUT /invoices/:id", function(){
    test("edit an invoice", async function(){
        const res = await request(app).put(`/invoices/${inv.id}`).send({
            amt: 1
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.invoice.amt).toEqual(1);
    });

    test("404 response on invalid id", async function () {
        const res = await request(app).put(`/invoices/0`).send({
            amt: 1
        });
        expect(res.statusCode).toBe(404);
    });

    test("400 response on missing body requirements", async function () {
        const res = await request(app).put(`/invoices/0`);
        expect(res.statusCode).toBe(400);
    });
});

describe("DELETE /companies/:code", function(){
    test("delete a company", async function(){
        const res = await request(app).delete(`/companies/${comp.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: "deleted"});
    });

    test("404 response on invalid code", async function(){
        const res = await request(app).delete(`/companies/0`);
        expect(res.statusCode).toBe(404);
    });
});

describe("DELETE /invoices/:code", function(){
    test("delete an invoice", async function(){
        const res = await request(app).delete(`/invoices/${inv.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({status: "deleted"});
    });

    test("404 response on invalid code", async function(){
        const res = await request(app).delete(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    });
});