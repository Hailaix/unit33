const express = require("express");
const ExpressError = require("../expressError");
const db = require("../db");

const router = new express.Router();

router.get('/', async function (req, res, next) {
    try {
        const result = await db.query(`SELECT * FROM invoices`);
        return res.json({ invoices: result.rows })
    }
    catch (e) {
        return next(e);
    }
});

router.get('/:id', async function (req, res, next) {
    try {
        const { id } = req.params;
        const result = await db.query(`
        SELECT *
        FROM invoices
        WHERE id=$1
        `, [id]);
        if (result.rows.length === 0) {
            throw new ExpressError(`cannot find invoice with id ${id}`, 404);
        }
        return res.json({ invoice: result.rows[0] });
    }
    catch (e) {
        return next(e);
    }
});

router.post('/', async function (req, res, next) {
    try {
        const { comp_code, amt } = req.body;
        if (!comp_code || !amt) {
            throw new ExpressError("request missing required field comp_code or amt", 400);
        }
        const result = await db.query(`
        INSERT INTO invoices (comp_code, amt)
        VALUES($1, $2)
        RETURNING *
        `, [comp_code, amt]);
        return res.status(201).json({ invoice: result.rows[0] });
    }
    catch (e) {
        return next(e);
    }
});

router.put('/:id', async function (req, res, next) {
    try {
        const { id } = req.params;
        const { amt } = req.body;
        if (!amt) {
            throw new ExpressError("request missing required field amt", 400);
        }
        const result = await db.query(`
        UPDATE invoices SET amt=$2
        WHERE id=$1
        RETURNING *
        `, [id, amt]);
        if (result.rows.length === 0) {
            throw new ExpressError(`cannot find invoice with id ${id}`, 404);
        }
        return res.json({ invoice: result.rows[0] });
    }
    catch (e) {
        return next(e);
    }
});

router.delete('/:id', async function (req, res, next) {
    try {
        const { id } = req.params;
        const result = await db.query(`
        DELETE FROM invoices
        WHERE id=$1
        RETURNING *
        `, [id]);
        if (result.rows.length === 0) {
            throw new ExpressError(`cannot find invoice with id ${id}`, 404);
        }
        return res.json({ status: "deleted" });
    }
    catch (e) {
        return next(e);
    }
});

module.exports = router;