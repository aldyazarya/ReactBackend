const express  = require('express')
const port = require('./config')
const cors = require('cors')
const multer = require('multer')
const sharp = require('sharp')
require('./config/mongose')

const User = require ('./models/user')
const Task = require ('./models/task')


const app = express()
app.use(cors())
app.use(express.json())

//input user
app.post('/users', async (req,res) => {
    const user = new User(req.body)

    try {
        await user.save()
        res.status(200).send(user)
    } catch (e) {
        res.status(400).send(e.message)
    }
})

// untuk mengaktifkan ini, file yg diubah di actions
//dan comment userSchema. find credential dan userSchema pre di file user.js
// app.get('/users', async (req, res) => {
//     const {email, password} = req.query

//     try {
//         const users = await User.findOne({email,password})
//         res.send(users)
//     } catch (e) {
//         res.send (e)
//     }
// })

//get user
app.post('/users/login', async (req, res) => {
    const {email, password} = req.body

    try {
        const user = await User.findByCredentials(email, password) //function buatan sendiri
        res.status(200).send(user)
    } catch (e) {
        res.status(404).send(e)
    }
})
// 4. delete user
// 5. delete all tasks when user deleted
app.delete('/users/:userid', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userid)
        if(!user){
            return res.status(400).send("Deleted User Failed")
        }
        //jika usernya ada, kita ngedelete semua tasksnya yg berkaitan sama usernya
        await Task.deleteMany({owner: user._id}).exec()
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})


//input tasks
app.post('/tasks/:userid', async (req, res) => {
    try {
        const user = await User.findById(req.params.userid)
        if(!user){
            throw new Error("Unable to create Tasks")
        }

        const task = new Task({...req.body, owner: user._id})
        user.tasks = user.tasks.concat(task._id) //
        await task.save() //untuk save ke database
        await user.save() // untuk save user.tasks kedalam user
        res.status(200).send(task)
    } catch (e) {
        
    }
})
//get own tasks
app.get("/tasks/:userId", async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.params.userId })
        .populate({ path: "tasks", 
                    options: { sort: { completed: false }, limit: 4 }
        }).exec();
      res.send(user.tasks);
    } catch (e) {}
  });
//2. delete tasks
app.delete("/tasks", async (req, res) => {
    try {
      const task = await Task.findOneAndDelete({ _id: req.body.taskid });
      const user = await User.findOne({ _id: req.body.owner });
  
      if (!task) {
        return res.status(404).send("Delete failed");
      }
  
      user.tasks = await user.tasks.filter(val => val != req.body.taskid);
      user.save();
      console.log(user.tasks);
  
      res.status(200).send(task);
    } catch (e) {
      res.status(500).send(e);
    }
  });
//edit tasks
app.patch('/tasks/:taskid/:userid', async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({err: "Invalid request!"})
    }

    try {
        const task = await Task.findOne({_id: req.params.taskid, owner: req.params.userid})

        if(!task){
            return res.status(404).send("Update Request")
        }

        updates.forEach(update => task[update] = req.body[update])
        await task.save()

        res.send("update berhasil")

    } catch (e) {

    }
})



const upload = multer ({ //multer = library untuk menerima file
    limits: {
        filesize: 1000000 //byte max size
    },
    fileFilter(req, file,cb){
        //untuk notif jika gambarna tidak masuk
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){ //escape character //untuk penulisan sebuah extension
            //ditolak
            return cb(new Error('Please Upload Image file(jpg, jpeg, png)'))
        }
        //diterima
        cb(undefined, true)

    }
})
//input avatar
app.post('/users/:userid/avatar', upload.single('avatar'), async (req,res) => {
    try {
        const buffer = await sharp(req.file.buffer).resize({width: 250}).png().toBuffer()
        const user = await User.findById(req.params.userid)

        if(!user) {
            throw Error ("unable to Upload")
        }
        user.avatar = buffer
        await user.save()
        res.send("Upload Success!")
    } catch (e) {
        res.send(e)
    }
} )
//show avatar
app.get('/users/:userid/avatar', async (req, res) => { // Get image, source gambar
    try {
        const user = await User.findById(req.params.userid)

        if(!user || !user.avatar) {
            throw new Error("Not found")
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.send(e)
    }
})
//3. Delete avatar
app.delete('/users/:userid/avatar', async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.userid, {$set: {avatar: null}});

        if(!user || !user.avatar){
            throw new Error('Not found')
        }
        
        res.send('avatar has been removed')

    } catch (e) {
        res.send(e)
    }
})

//show profile
//input name
app.post('/users/:userid', async (req, res) => {
    try {
        const user = await User.findById(req.params.userid)
        if(!user){
            throw new Error("user not found")
        }
        res.send(user.name)

    } catch (e) {
        res.send(e)
        
    }
})


//edit profile
app.patch("/users/:userId", async (req, res) => {
    console.log(req.body);
  
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "age", "email"];
    const isValidOperation = updates.every(update =>
      allowedUpdates.includes(update)
    );
  
    if (!isValidOperation) {
      return res.status(400).send({ err: "Invalid request!" });
    }
  
    try {
      const user = await User.findOne({
        _id: req.params.userId
      });
  
      if (!user) {
        return res.status(404).send("Update Request");
      }
  
      updates.forEach(update => (user[update] = req.body[update]));
      await user.save();
  
      res.send(user);
    } catch (e) {}
  });
  
//delete profile
app.delete("/users/:userId/delete", async (req, res) => {
  const { userId } = req.params;

  try {
    await User.findOneAndDelete({ _id: userId });
    await Task.deleteMany({ owner: userId });

    res.send("success");
  } catch (e) {}
});
  
app.get('/', (req, res) => {
    res.send(`<h1>API Running on Heroku ${port}</h1>`)
})

app.listen(port, () => console.log("API Running on port" + port))



