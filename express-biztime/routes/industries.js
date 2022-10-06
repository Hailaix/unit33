const express = require("express");
const ExpressError = require("../expressError");
const slugify = require("slugify");
const db = require("../db");

const router = new express.Router();

router.get('/', async function (req, res, next) {
    try {
        const result = await db.query(`SELECT * FROM industries`);
        return res.json({ industries: result.rows });
    }
    catch (e) {
        return next(e);
    }
});

router.get('/:code', async function (req, res, next) {
    try {
        const { code } = req.params;
        const result = await db.query(`
        SELECT i.code AS icode, i.industry, c.code, c.name, c.description
        FROM industries AS i
        LEFT JOIN companies_industries AS ci
        ON i.code = ci.industry_code
        LEFT JOIN companies AS c
        ON ci.company_code = c.code
        WHERE i.code = $1
        `, [code]);
        const { icode, industry } = result.rows[0];
        const companies = result.rows.map(r => {
            const { code, name, description } = r;
            return { code, name, description };
        });
        return res.json({ code: icode, industry, companies });
    }
    catch (e) {
        return next(e);
    }
});

router.post('/', async function (req, res, next) {
    try {
        const { industry } = req.body;
        if (!industry) {
            throw new ExpressError("request missing required field industry", 400);
        }
        const result = await db.query(`
        INSERT INTO industries (code, industry)
        VALUES ($1,$2)
        RETURNING *
        `, [slugify(industry, { lower: true }), industry]);
        return res.status(201).json({ industry: result.rows[0] });
    }
    catch (e) {
        return next(e);
    }
});

router.post('/:code', async function (req, res, next) {
    try {
        const icode = req.params.code;
        const ccode = req.body.code;
        if (!ccode) {
            throw new ExpressError("request missing required field code", 400);
        }
        const result = await db.query(`
        INSERT INTO companies_industries (industry_code, company_code)
        VALUES ($1,$2)
        RETURNING *
        `, [icode, ccode]);
        return res.status(201).json({ association: result.rows[0]});
    }
    catch (e) {
        return next(e);
    }
});

module.exports = router;


// const result = await db.query(`
//         SELECT i.code AS icode, i.industry, c.code AS ccode, c.name, c.description
//         FROM industries AS i
//         LEFT JOIN companies_industries AS ci
//         ON i.code = ci.industry_code
//         LEFT JOIN companies AS c
//         ON ci.company_code = c.code
//         `);