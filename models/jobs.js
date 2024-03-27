const db = require('../db')
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { findAll } = require('./company');

class Job{
    static async create({title, salary, equity, company_handle}){
        const result = await db.query(
            `INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS companyHandle`
            [
                title, 
                salary,
                equity, 
                companyHandle
            ]
        )
        const job = result.rows[0]

        return job 
    }


static async findAll({ title, minSalary, hasEquity }) {
    let query = `SELECT id,
                    title, 
                    salary, 
                    CAST(equity AS NUMERIC) AS equity, 
                    company_handle AS "companyHandle"
             FROM jobs`;

    const values = [];

    if (title) {
        query += ` WHERE title ILIKE $${values.length + 1}`;
        values.push(`%${title}%`);
    }

    if (minSalary) {
        query += `${title ? ' AND' : ' WHERE'} salary >= $${values.length + 1}`;
        values.push(minSalary);
    }

    if (hasEquity === 'true') {
        query += `${title || minSalary ? ' AND' : ' WHERE'} 
        (equity IS NOT NULL AND equity > 0)`;
    }

    if (hasEquity === 'false') {
        query += `${title || minSalary ? ' AND' : ' WHERE'} 
        (equity IS NULL OR equity = 0)`;
    }

    query += " ORDER BY title";

    const jobsRes = await db.query(query, values);
    return jobsRes.rows;
}


/** Given a job title, return data about job.
 *
 * Returns { title, salary, equity, company_handle }
 *
 * Throws NotFoundError if not found.
 **/

static async get(id) {
    const jobRes = await db.query(
        `SELECT id,
            title, 
            salary, 
            equity, 
            company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
}

/** Update job data with `data`.
 *
 * This is a "partial update" --- it's fine if data doesn't contain all the
 * fields; this only changes provided ones.
 *
 * Data can include: {title, salary, equity}
 *
 * Returns {title, salary, equity, company_handle}
 *
 * Throws NotFoundError if not found.
 */

static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
            companyHandle: "company_handle",
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                  SET ${setCols} 
                  WHERE id = ${idVarIdx} 
                  RETURNING id,
                            title, 
                            salary, 
                            equity, 
                            company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
}

/** Delete given job from database; returns undefined.
 *
 * Throws NotFoundError if job not found.
 **/

static async remove(id) {
    const result = await db.query(
        `DELETE
         FROM jobs
         WHERE id = $1
         RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
}
}


module.exports = Job;