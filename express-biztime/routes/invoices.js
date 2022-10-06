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
        const invoice = result.rows[0];
        const compRes = await db.query(`
        SELECT *
        FROM companies
        WHERE code=$1
        `, [invoice.comp_code]);
        delete invoice.comp_code;
        invoice.company = compRes.rows[0];
        return res.json({ invoice: invoice });
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
        const { amt, paid } = req.body;
        if (!amt || (!paid && paid !== false)) {
            throw new ExpressError("request missing required field paid or amt", 400);
        }
        const oldpayment = await db.query(`
        SELECT *
        FROM invoices
        WHERE id = $1
        `, [id]);
        if (oldpayment.rows.length === 0) {
            throw new ExpressError(`cannot find invoice with id ${id}`, 404);
        }
        //If paying unpaid invoice: sets paid_date to today
        let new_date = new Date();
        //If the payment was already made, keep that date
        if(paid && oldpayment.rows[0].paid_date){
            new_date = oldpayment.rows[0].paid_date;
        }
        else if (!paid){
            //if un-paying set to null
            new_date = null;
        }
        const result = await db.query(`
        UPDATE invoices 
        SET amt=$2, paid=$3, paid_date=$4
        WHERE id=$1
        RETURNING *
        `, [id, amt, paid, new_date]);
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