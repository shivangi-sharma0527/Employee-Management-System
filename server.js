require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const asyncHandler = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);

app.get('/api/health', asyncHandler(async (req,res)=>{
  await pool.query('SELECT 1');
  res.json({ok:true});
}));

app.get('/api/departments', asyncHandler(async (req,res)=>{
  const { rows } = await pool.query(`SELECT d.id,d.name,d.description,COUNT(e.id)::int AS employee_count
    FROM departments d LEFT JOIN employees e ON e.department_id=d.id
    GROUP BY d.id ORDER BY d.name`);
  res.json(rows);
}));

app.post('/api/departments', asyncHandler(async (req,res)=>{
  const {name,description=''}=req.body;
  if(!name?.trim()) return res.status(400).json({message:'Department name is required.'});
  const {rows}=await pool.query('INSERT INTO departments(name,description) VALUES($1,$2) RETURNING *',[name.trim(),description.trim()]);
  res.status(201).json(rows[0]);
}));

app.get('/api/employees', asyncHandler(async (req,res)=>{
  const {search='',department='',status=''}=req.query;
  const params=[]; const where=[];
  if(search){params.push(`%${search}%`); where.push(`(e.employee_code ILIKE $${params.length} OR e.full_name ILIKE $${params.length} OR e.email ILIKE $${params.length} OR e.designation ILIKE $${params.length})`)}
  if(department){params.push(department); where.push(`e.department_id=$${params.length}`)}
  if(status){params.push(status); where.push(`e.employment_status=$${params.length}`)}
  const sql=`SELECT e.*,d.name AS department_name FROM employees e LEFT JOIN departments d ON d.id=e.department_id ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY e.id DESC`;
  const {rows}=await pool.query(sql,params); res.json(rows);
}));

app.get('/api/employees/:id', asyncHandler(async(req,res)=>{
  const {rows}=await pool.query('SELECT e.*,d.name AS department_name FROM employees e LEFT JOIN departments d ON d.id=e.department_id WHERE e.id=$1',[req.params.id]);
  if(!rows[0]) return res.status(404).json({message:'Employee not found.'});
  res.json(rows[0]);
}));

app.post('/api/employees', asyncHandler(async(req,res)=>{
  const v=req.body;
  if(!v.employee_code||!v.full_name||!v.email||!v.phone||!v.designation||!v.joining_date) return res.status(400).json({message:'Please fill all required fields.'});
  const {rows}=await pool.query(`INSERT INTO employees(employee_code,full_name,email,phone,department_id,designation,salary,joining_date,employment_status,address)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,[v.employee_code.trim(),v.full_name.trim(),v.email.trim(),v.phone.trim(),v.department_id||null,v.designation.trim(),Number(v.salary)||0,v.joining_date,v.employment_status||'Active',v.address?.trim()||'']);
  res.status(201).json(rows[0]);
}));

app.put('/api/employees/:id', asyncHandler(async(req,res)=>{
  const v=req.body;
  const {rows}=await pool.query(`UPDATE employees SET employee_code=$1,full_name=$2,email=$3,phone=$4,department_id=$5,designation=$6,salary=$7,joining_date=$8,employment_status=$9,address=$10,updated_at=CURRENT_TIMESTAMP WHERE id=$11 RETURNING *`,[v.employee_code.trim(),v.full_name.trim(),v.email.trim(),v.phone.trim(),v.department_id||null,v.designation.trim(),Number(v.salary)||0,v.joining_date,v.employment_status||'Active',v.address?.trim()||'',req.params.id]);
  if(!rows[0]) return res.status(404).json({message:'Employee not found.'}); res.json(rows[0]);
}));

app.delete('/api/employees/:id', asyncHandler(async(req,res)=>{
  const result=await pool.query('DELETE FROM employees WHERE id=$1',[req.params.id]);
  if(!result.rowCount) return res.status(404).json({message:'Employee not found.'}); res.json({message:'Employee deleted successfully.'});
}));

app.get('/api/reports/summary', asyncHandler(async(req,res)=>{
  const [totals,dept,status,salary]=await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE employment_status='Active')::int AS active,COUNT(*) FILTER(WHERE employment_status='On Leave')::int AS on_leave,COUNT(*) FILTER(WHERE employment_status='Inactive')::int AS inactive,COALESCE(ROUND(AVG(salary),2),0) AS avg_salary FROM employees`),
    pool.query(`SELECT COALESCE(d.name,'Unassigned') AS department,COUNT(e.id)::int AS count FROM employees e LEFT JOIN departments d ON d.id=e.department_id GROUP BY d.name ORDER BY count DESC`),
    pool.query(`SELECT employment_status AS status,COUNT(*)::int AS count FROM employees GROUP BY employment_status ORDER BY count DESC`),
    pool.query(`SELECT COALESCE(SUM(salary),0) AS payroll FROM employees WHERE employment_status='Active'`)
  ]);
  res.json({totals:totals.rows[0],departments:dept.rows,status:status.rows,payroll:salary.rows[0].payroll});
}));

app.get('/api/reports/employees.csv', asyncHandler(async(req,res)=>{
  const {rows}=await pool.query(`SELECT e.employee_code,e.full_name,e.email,e.phone,COALESCE(d.name,'Unassigned') department,e.designation,e.salary,e.joining_date,e.employment_status,e.address FROM employees e LEFT JOIN departments d ON d.id=e.department_id ORDER BY e.id`);
  const headers=['Employee Code','Full Name','Email','Phone','Department','Designation','Salary','Joining Date','Status','Address'];
  const esc=x=>`"${String(x??'').replace(/"/g,'""')}"`;
  const csv=[headers.map(esc).join(','),...rows.map(r=>[r.employee_code,r.full_name,r.email,r.phone,r.department,r.designation,r.salary,r.joining_date?.toISOString?.().slice(0,10)||r.joining_date,r.employment_status,r.address].map(esc).join(','))].join('\n');
  res.setHeader('Content-Type','text/csv');res.setHeader('Content-Disposition','attachment; filename=employee-report.csv');res.send(csv);
}));

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.use((err,req,res,next)=>{console.error(err);res.status(err.code===23505?409:500).json({message:err.code===23505?'A record with this unique value already exists.':'Something went wrong on the server.'})});

app.listen(port,()=>console.log(`Employee Management System running at http://localhost:${port}`));
