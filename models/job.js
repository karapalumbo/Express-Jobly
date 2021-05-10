"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");



class Job {

  static async create(data) {
    const result = await db.query(
          `INSERT INTO jobs (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          data.title,
          data.salary,
          data.equity,
          data.companyHandle,
        ],
    );
    let job = result.rows[0];

    return job;
  }


  static async findAll(searchFilters = {}) { 
      let query =`SELECT j.id, 
                         j.title, 
                         j.salary, 
                         j.equity, 
                         j.company_handle AS "companyHandle", 
                         c.name AS "companyName"
                  FROM jobs j 
                    LEFT JOIN companies AS c ON c.handle = j.company_handle`;
    
    let whereExpressions = []; 
    let queryValues = []; 

    const { title, minSalary, hasEquity } = searchFilters;

    if (title !== undefined) {
      queryValues.push(`%${title}%`);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereExpressions.push(`salary >= $${queryValues.length}`);
    }

    if (hasEquity === true) {
      whereExpressions.push(`equity > 0`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    query += " ORDER BY title";

    let jobsRes = await db.query(query, queryValues);
    return jobsRes.rows;
  }


  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }


  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
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