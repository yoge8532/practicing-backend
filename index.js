const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
const { v4 : uuidv4 } = require('uuid');

app.use(express.urlencoded({extended:true}));
app.use(express.json())

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

app.use(express.static(path.join(__dirname,'public')));

app.listen(port,()=>{
    console.log(`listening on ${port}`);
});


app.get("/",(req,res)=>{
    res.send("server is listenig");
});


let posts = [
    {
        id:uuidv4(),
        username: "Yogesh Tiwari",
        content: "i didn't get selected for any internship till now"
    },
    {
        id:uuidv4(),
        username: "Shubhiksha Singh",
        content: "i got selected in Aditya birla Finance group"
    },
    {
        id:uuidv4(),
        username: "Abhay Singh",
        content: "i didn't get selected for any internship till now"
    }
]

app.get("/posts",(req,res)=>{
    res.render("index.ejs",{ posts });
});

app.get("/posts/new",(req,res)=>{
    res.render("new.ejs");
})

app.post("/posts",(req,res)=>{
    let {username, content} = req.body;
    let id = uuidv4();
    posts.push({id,username,content});
    res.redirect("/posts");
    
});

app.get("/posts/:id",(req,res)=>{
    let { id } = req.params;
    let post = posts.find((p)=>id===p.id);
    console.log(post);
    res.render("show.ejs",{ post});
});

app.patch("/posts/:id",(req,res)=>{
    let { id } = req.params;
    console.log(id);
    res.send("working");
})