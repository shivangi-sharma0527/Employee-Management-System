const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const seedDepartments = ["Engineering","Human Resources","Finance","Marketing","Sales"];
const seedEmployees = [
  {id:1,name:"Aarav Sharma",email:"aarav@example.com",phone:"9876543210",department:"Engineering",designation:"Software Engineer",salary:65000,joining:"2025-06-12",status:"Active",address:"Mathura, India"},
  {id:2,name:"Priya Verma",email:"priya@example.com",phone:"9876543211",department:"Human Resources",designation:"HR Executive",salary:52000,joining:"2025-08-04",status:"Active",address:"Delhi, India"},
  {id:3,name:"Rohan Singh",email:"rohan@example.com",phone:"9876543212",department:"Finance",designation:"Accountant",salary:48000,joining:"2024-11-18",status:"Active",address:"Agra, India"},
  {id:4,name:"Ananya Gupta",email:"ananya@example.com",phone:"9876543213",department:"Marketing",designation:"Marketing Associate",salary:45000,joining:"2025-01-25",status:"Inactive",address:"Jaipur, India"}
];

let users = JSON.parse(localStorage.getItem("ems_users") || "[]");
let employees = JSON.parse(localStorage.getItem("ems_employees") || "null") || seedEmployees;
let departments = JSON.parse(localStorage.getItem("ems_departments") || "null") || seedDepartments;
let currentUser = JSON.parse(sessionStorage.getItem("ems_current_user") || "null");
let signUpMode = false;

function save(){
  localStorage.setItem("ems_users", JSON.stringify(users));
  localStorage.setItem("ems_employees", JSON.stringify(employees));
  localStorage.setItem("ems_departments", JSON.stringify(departments));
}
function toast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2200);
}
function initials(name){return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN");}
function canEdit(){return !!currentUser;}
function showAuth(){
  $("#authPage").classList.remove("hidden"); $("#appPage").classList.add("hidden");
}
function showApp(){
  if(!currentUser){showAuth();return}
  $("#authPage").classList.add("hidden"); $("#appPage").classList.remove("hidden");
  $("#userName").textContent=currentUser.name; $("#userRole").textContent=currentUser.role;
  $("#userAvatar").textContent=initials(currentUser.name);
  $("#currentDate").textContent=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
  renderAll();
}
function setupAuth(){
  $("#switchAuth").onclick=()=>{
    signUpMode=!signUpMode;
    $("#authTitle").textContent=signUpMode?"Create Account":"Welcome Back";
    $("#authSubtitle").textContent=signUpMode?"Create an account to access EMS.":"Sign in to manage your organization.";
    $("#nameGroup").classList.toggle("hidden",!signUpMode);
    $("#authSubmit").textContent=signUpMode?"Sign Up":"Sign In";
    $("#switchMessage").textContent=signUpMode?"Already have an account?":"Don't have an account?";
    $("#switchAuth").textContent=signUpMode?"Sign In":"Create Account";
  };
  $("#authForm").onsubmit=e=>{
    e.preventDefault();
    const email=$("#authEmail").value.trim().toLowerCase(), password=$("#authPassword").value;
    if(signUpMode){
      if(users.some(u=>u.email===email)) return toast("Email already registered.");
      const user={id:Date.now(),name:$("#authName").value.trim()||"New User",email,password,role:"viewer"};
      users.push(user); save(); toast("Account created. Please sign in."); $("#switchAuth").click();
      $("#authEmail").value=email; $("#authPassword").value="";
    }else{
      const user=users.find(u=>u.email===email && u.password===password);
      if(!user) return toast("Invalid email or password.");
      currentUser=user; sessionStorage.setItem("ems_current_user",JSON.stringify(user)); showApp();
    }
  };
}
function renderAll(){renderStats();renderDepartments();renderEmployees();renderFilters();renderReports();renderRecent();}
function renderStats(){
  $("#totalEmployees").textContent=employees.length;
  $("#activeEmployees").textContent=employees.filter(e=>e.status==="Active").length;
  $("#totalDepartments").textContent=departments.length;
  const avg=employees.length?employees.reduce((a,e)=>a+Number(e.salary),0)/employees.length:0;
  $("#avgSalary").textContent=money(Math.round(avg));
  const chart=$("#departmentChart"); const max=Math.max(1,...departments.map(d=>employees.filter(e=>e.department===d).length));
  chart.innerHTML=departments.map(d=>{const c=employees.filter(e=>e.department===d).length;return `<div class="chart-item"><div class="chart-label"><span>${d}</span><strong>${c}</strong></div><div class="bar"><span style="width:${c/max*100}%"></span></div></div>`}).join("") || "<p>No departments yet.</p>";
}
function renderRecent(){
  const list=[...employees].sort((a,b)=>new Date(b.joining)-new Date(a.joining)).slice(0,5);
  $("#recentEmployees").innerHTML=list.map(e=>`<div class="recent-item"><div class="recent-left"><div class="mini-avatar">${initials(e.name)}</div><div><strong>${e.name}</strong><small>${e.designation}</small></div></div><small>${e.department}</small></div>`).join("")||"<p>No employees found.</p>";
}
function renderFilters(){
  $("#departmentFilter").innerHTML='<option value="">All Departments</option>'+departments.map(d=>`<option>${d}</option>`).join("");
  $("#empDepartment").innerHTML=departments.map(d=>`<option>${d}</option>`).join("");
}
function renderEmployees(){
  const q=$("#searchInput").value.toLowerCase(), dep=$("#departmentFilter").value, st=$("#statusFilter").value;
  const data=employees.filter(e=>(!q||`${e.name} ${e.email} ${e.designation}`.toLowerCase().includes(q))&&(!dep||e.department===dep)&&(!st||e.status===st));
  $("#employeeTable").innerHTML=data.map(e=>`<tr>
    <td><div class="employee-cell"><div class="mini-avatar">${initials(e.name)}</div><div><strong>${e.name}</strong><small>${e.email}</small></div></div></td>
    <td>${e.department}</td><td>${e.designation}</td><td>${e.joining}</td>
    <td><span class="badge ${e.status.toLowerCase()}">${e.status}</span></td><td>${money(e.salary)}</td>
    <td><button class="action-btn" onclick="editEmployee(${e.id})">✎ Edit</button><button class="action-btn delete" onclick="deleteEmployee(${e.id})">🗑 Delete</button></td>
  </tr>`).join("")||'<tr><td colspan="7">No employees found.</td></tr>';
}
function renderDepartments(){
  $("#departmentCards").innerHTML=departments.map(d=>{const count=employees.filter(e=>e.department===d).length;return `<div class="department-card"><h3>${d}</h3><p>Department</p><div class="count">${count}</div><p>Employees</p></div>`}).join("");
}
function renderReports(){
  const active=employees.filter(e=>e.status==="Active").length;
  const totalSalary=employees.reduce((a,e)=>a+Number(e.salary),0);
  $("#reportSummary").innerHTML=`<div class="summary-box"><span>Total Employees</span><strong>${employees.length}</strong></div><div class="summary-box"><span>Active Employees</span><strong>${active}</strong></div><div class="summary-box"><span>Total Monthly Salary</span><strong>${money(totalSalary)}</strong></div>`;
}
function openEmployee(id=null){
  $("#employeeModal").classList.remove("hidden");
  $("#modalTitle").textContent=id?"Edit Employee":"Add Employee";
  const e=id?employees.find(x=>x.id===id):null;
  $("#employeeId").value=e?.id||""; $("#empName").value=e?.name||""; $("#empEmail").value=e?.email||"";
  $("#empPhone").value=e?.phone||""; $("#empDepartment").value=e?.department||departments[0]||"";
  $("#empDesignation").value=e?.designation||""; $("#empSalary").value=e?.salary||"";
  $("#empJoining").value=e?.joining||""; $("#empStatus").value=e?.status||"Active"; $("#empAddress").value=e?.address||"";
}
window.editEmployee=id=>openEmployee(id);
window.deleteEmployee=id=>{
  const e=employees.find(x=>x.id===id); if(!e)return;
  if(confirm(`Delete ${e.name}?`)){employees=employees.filter(x=>x.id!==id);save();renderAll();toast("Employee deleted.");}
};
$("#employeeForm").onsubmit=e=>{
  e.preventDefault();
  const id=Number($("#employeeId").value);
  const data={id:id||Date.now(),name:$("#empName").value.trim(),email:$("#empEmail").value.trim(),phone:$("#empPhone").value.trim(),department:$("#empDepartment").value,designation:$("#empDesignation").value.trim(),salary:Number($("#empSalary").value),joining:$("#empJoining").value,status:$("#empStatus").value,address:$("#empAddress").value.trim()};
  if(id) employees=employees.map(x=>x.id===id?data:x); else employees.push(data);
  save(); closeModal("employeeModal"); renderAll(); toast(id?"Employee updated.":"Employee added.");
};
$("#addEmployeeBtn").onclick=()=>openEmployee();
$("#addDepartmentBtn").onclick=()=>{if(!canEdit())return toast("Only Admin or HR can add departments.");$("#departmentModal").classList.remove("hidden");};
$("#departmentForm").onsubmit=e=>{e.preventDefault();if(!canEdit())return;const name=$("#departmentName").value.trim();if(!name)return;if(departments.includes(name))return toast("Department already exists.");departments.push(name);save();closeModal("departmentModal");$("#departmentName").value="";renderAll();toast("Department added.");};
function closeModal(id){$("#"+id).classList.add("hidden")}
$$("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
$("#searchInput").oninput=renderEmployees;$("#departmentFilter").onchange=renderEmployees;$("#statusFilter").onchange=renderEmployees;
$$(".nav-btn").forEach(btn=>btn.onclick=()=>{ $$(".nav-btn").forEach(x=>x.classList.remove("active"));btn.classList.add("active");$$(".section").forEach(x=>x.classList.remove("active-section"));$("#"+btn.dataset.section).classList.add("active-section");const titles={dashboard:["Dashboard","Overview of your workforce"],employees:["Employees","Manage employee records"],departments:["Departments","Organize your workforce"],reports:["Reports","Export and analyze employee data"]};$("#pageTitle").textContent=titles[btn.dataset.section][0];$("#pageSubtitle").textContent=titles[btn.dataset.section][1];});
$("#logoutBtn").onclick=()=>{currentUser=null;sessionStorage.removeItem("ems_current_user");showAuth();toast("Logged out.");};
$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("ems_dark",document.body.classList.contains("dark"));};
if(localStorage.getItem("ems_dark")==="true")document.body.classList.add("dark");
$("#exportBtn").onclick=()=>{
  const headers=["ID","Name","Email","Phone","Department","Designation","Salary","Joining Date","Status","Address"];
  const rows=employees.map(e=>[e.id,e.name,e.email,e.phone,e.department,e.designation,e.salary,e.joining,e.status,e.address]);
  const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="employee-report.csv";a.click();URL.revokeObjectURL(url);
};
setupAuth(); showApp();
