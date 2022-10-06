const express = require("express");
const ExpressError = require("../expressError");
const slugify = require("slugify");
const db = require("../db");

const router = new express.Router();

router.get('/', async function (req, res, next) {
    try {
        const result = await db.query(`SELECT * FROM companies`);
        return res.json({ companies: result.rows });
    }
    catch (e) {
        return next(e);
    }
});

router.get('/:code', async function (req, res, next) {
    try {
        const { code } = req.params;
        const results = await Promise.all([
            db.query(`
            SELECT c.name, c.description, i.industry 
            FROM companies AS c
            LEFT JOIN companies_industries AS ci
            ON c.code = ci.company_code
            LEFT JOIN industries AS i
            ON ci.industry_code = i.code
            WHERE c.code=$1`, [code]),
            db.query(`
            SELECT *
            FROM invoices
            WHERE comp_code=$1`, [code])]);
        if (results[0].rows.length === 0) {
            throw new ExpressError(`cannot find company with code ${code}`, 404);
        }
        const { name, description } = results[0].rows[0];
        const company = { code, name, description };
        if (results[0].rows[0].industry) {
            company.industries = results[0].rows.map(r => r.industry);
        }
        else{
            company.industries = [];
        }
        company.invoices = results[1].rows;
        return res.json({ company: company });
    }
    catch (e) {
        return next(e);
    }
});

router.post('/', async function (req, res, next) {
    try {
        const { name, description } = req.body;
        if (!name || !description) {
            throw new ExpressError("request missing required field code name or description", 400);
        }
        const result = await db.query(`
        INSERT INTO companies (code, name, description)
        VALUES($1, $2, $3)
        RETURNING code, name, description
        `, [slugify(name, { lower: true }), name, description]);

        return res.status(201).json({ company: result.rows[0] });
    }
    catch (e) {
        return next(e);
    }
});

router.put('/:code', async function (req, res, next) {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        if (!name || !description) {
            throw new ExpressError("request missing required field name or description", 400);
        }
        const result = await db.query(`
        UPDATE companies
        SET name=$2, description=$3
        WHERE code=$1
        RETURNING *
        `, [code, name, description]);

        if (result.rows.length === 0) {
            throw new ExpressError(`cannot find company with code ${code}`, 404);
        }

        return res.json({ company: result.rows[0] });
    }
    catch (e) {
        return next(e);
    }
});

router.delete('/:code', async function (req, res, next) {
    try {
        const { code } = req.params;
        const result = await db.query(`
        DELETE FROM companies WHERE code=$1
        RETURNING *
        `, [code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`cannot find company with code ${code}`, 404);
        }

        return res.json({ status: "deleted" });
    }
    catch (e) {
        return next(e);
    }
});

module.exports = router;