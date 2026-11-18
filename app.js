const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const storageKey = "athena.tasks.v1";
let tasks = [];
try { tasks = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { tasks = []; }
let currentFilter = "all";

$("#todayDate").textContent = new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date());

function navigate(view) {
  $$(".view").forEach(section => section.classList.toggle("active-view", section.id === `view-${view}`));
  $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  $("#crumb").textContent = view.toUpperCase();
  $("#sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}
$$(".nav-item").forEach(button => button.addEventListener("click", () => navigate(button.dataset.view)));
$$("[data-go]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.go)));
$("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

function saveTasks(){ localStorage.setItem(storageKey, JSON.stringify(tasks)); renderTasks(); }
function renderTasks(){
  const open = tasks.filter(task=>!task.done).length;
  const done = tasks.length-open;
  $("#openTaskStat").textContent=String(open).padStart(2,"0");
  $("#doneTaskStat").textContent=String(done).padStart(2,"0");
  $("#navTaskCount").textContent=open;
  $("#openCount").textContent=open;
  $("#doneCount").textContent=done;
  $("#taskTotalTag").textContent=`${tasks.length} TASKS`;
  const percent=tasks.length?Math.round(done/tasks.length*100):0;
  $("#progressPercent").textContent=percent+"%";
  $("#progressRing").style.background=`conic-gradient(#9a80eb ${percent*3.6}deg,#29334a 0deg)`;
  const filtered=tasks.filter(task=>currentFilter==="all"||(currentFilter==="done"?task.done:!task.done));
  $("#taskList").innerHTML=filtered.length?filtered.map(task=>`<div class="task-row ${task.done?"completed":""}"><input type="checkbox" data-toggle="${task.id}" ${task.done?"checked":""} aria-label="Complete task"><span class="task-title"></span><span class="task-priority ${task.priority}">${task.priority}</span><button class="delete-task" data-delete="${task.id}" aria-label="Delete task">×</button></div>`).join(""):`<div class="empty-state">Nothing here right now.<br><span>Add a task to get started.</span></div>`;
  $$("#taskList .task-row").forEach((row,index)=>{row.querySelector(".task-title").textContent=filtered[index].title;});
  $$("[data-toggle]").forEach(input=>input.addEventListener("change",()=>{const item=tasks.find(task=>task.id===input.dataset.toggle);if(item){item.done=input.checked;saveTasks();}}));
  $$("[data-delete]").forEach(button=>button.addEventListener("click",()=>{tasks=tasks.filter(task=>task.id!==button.dataset.delete);saveTasks();}));
  const focus=tasks.filter(task=>!task.done).sort((a,b)=>({high:0,medium:1,low:2}[a.priority]-({high:0,medium:1,low:2}[b.priority]))).slice(0,3);
  $("#focusQueue").innerHTML=focus.length?focus.map(task=>`<div class="focus-item"><i class="priority-dot ${task.priority}"></i><strong></strong><small>${task.priority.toUpperCase()}</small></div>`).join(""):`<div class="empty-state">No tasks yet.<br><span>Add your first mission in Task Manager.</span></div>`;
  $$("#focusQueue .focus-item strong").forEach((node,index)=>node.textContent=focus[index].title);
}
$("#taskForm").addEventListener("submit",event=>{
  event.preventDefault();
  const title=$("#taskInput").value.trim(); if(!title)return;
  tasks.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),title,priority:$("#taskPriority").value,done:false,createdAt:Date.now()});
  $("#taskInput").value="";currentFilter="all";
  $$(".filter").forEach(button=>button.classList.toggle("active",button.dataset.filter==="all"));
  saveTasks();
});
$$(".filter").forEach(button=>button.addEventListener("click",()=>{currentFilter=button.dataset.filter;$$(".filter").forEach(item=>item.classList.toggle("active",item===button));renderTasks();}));

const replies=[
  {test:/plan.*day|day.*plan/i,reply:"Let’s make it manageable: choose one important task, two supporting tasks, and one small break. Add them in Task Manager and mark the most important one as High priority."},
  {test:/five projects|projects|roadmap/i,reply:"The roadmap has five independent projects: ATHENA is your personal command center, ECHO builds software from ideas, ORBIT manages PC workflows, MIRAGE simulates virtual worlds, and GENESIS explores startup concepts. We’ll review each before connecting them."},
  {test:/idea|project idea/i,reply:"Try a simple first mission: build a personal study tracker that turns a topic list into daily learning goals. Start small, test it, then add AI features after the basic workflow works."},
  {test:/hello|hi|hey/i,reply:"Hello! Your command center is ready in demo mode. You can explore Projects, add tasks, or test the assistant interface."}
];
function addMessage(text,isUser=false){
  const node=document.createElement("div");node.className="message "+(isUser?"user-message":"assistant-message");
  const label=document.createElement("span");label.className="message-label";label.textContent=isUser?"YOU":"ATHENA";
  const body=document.createElement("p");body.textContent=text;node.append(label,body);$("#chatMessages").append(node);$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight;
}
function answer(message){
  const found=replies.find(item=>item.test.test(message));
  return found?found.reply:"I’ve received your idea. This ATHENA preview uses scripted local replies, so it cannot reason with a live AI model yet. For now, add the next action to Task Manager or explore the project roadmap.";
}
$("#chatForm").addEventListener("submit",event=>{
  event.preventDefault();const input=$("#chatInput");const value=input.value.trim();if(!value)return;
  addMessage(value,true);input.value="";window.setTimeout(()=>addMessage(answer(value)),250);
});
$$(".suggestions button").forEach(button=>button.addEventListener("click",()=>{const value=button.textContent;addMessage(value,true);window.setTimeout(()=>addMessage(answer(value)),250);}));
renderTasks();