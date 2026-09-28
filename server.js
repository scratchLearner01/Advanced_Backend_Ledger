import app from "./src/app.js"
import connectDB from "./src/config/db.js"


app.listen(8080,()=>{
    console.log("Server Started On PORT 8080");
})
connectDB();