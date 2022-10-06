const express = require("express");
const ExpressError = require("../expressError");
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
        const result = await db.query(`
        SELECT * 
        FROM companies 
        WHERE code=$1`, [code]);
        if (result.rows.length === 0) {
            throw new ExpressError(`cannot find company with code ${code}`, 404);
        }
        return res.json({ company: result.rows[0] });
    }
    catch (e) {
        return next(e);
    }
});

router.post('/', async function (req, res, next) {
    try {
        const { code, name, description } = req.body;
        if (!code || !name || !description) {
            throw new ExpressError("request missing required field code name or description", 400);
        }
        const result = await db.query(`
        INSERT INTO companies (code, name, description)
        VALUES($1, $2, $3)
        RETURNING code, name, description
        `, [code, name, description]);

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