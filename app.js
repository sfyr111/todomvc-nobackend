// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import AV from 'leancloud-storage'
import 'bootstrap/dist/css/bootstrap.css'
import 'todomvc-app-css/index.css'
import 'animate.css'
import './todo.css'

// Vue.config.productionTip = false

/* eslint-disable no-new */
// new Vue({
//   el: '#app',
//   router,
//   template: '<App/>',
//   components: { App }
// })


/**
 * @https://leancloud.cn/docs/leanstorage_guide-js.html
 * @数据存储开发指南-javascript
 */

/**
 * @init leancloud
 */
const APP_ID = 'oaXyyBa5kIwqVMIOtqgHdNO5-gzGzoHsz';
const APP_KEY = 'w2G7z7u0A4ltDvBYfx8vn9fW';
AV.init({
  appId: APP_ID,
  appKey: APP_KEY
});

/**
 * @todumvc
 */
let filters = {
 all(todos) {
  return todos
 },
 // 数组过滤方法，输入数组，返回满足条件的值
 active(todos) {
  return todos.filter(todo => !todo.completed)
 },
 completed(todos) {
  return todos.filter(todo => todo.completed)
 }
}

let vm = new Vue({
 el: '.todoapp',
 data: {
  message: 'todos',
  newTodo: '',
  todos: [],
  editedTodo: null,
  hashName: 'all',
  activeType: 'login',
  formData: {
    username: '',
    password: ''
  },
  currentUser: null
 },
 computed: {
  remain() { // 剩余的数量，也就是active状态的
   // 计算属性，把数组满足过滤器active的长度返回
   return filters.active(this.todos).length
  },
  isAll: {
   get() { // 这个checkbox的状态也就是他的布尔状态是根据剩余active的数量决定，如果全部完成就是全部打钩，那么这个按钮就true高亮选中
    return this.remain === 0
   },
   set(boolean) { // 把checkbox表单的值，也就是选中与否的布尔值传入，然后把这个布尔值传给todos每个元素的状态上
    return this.todos.forEach(todo => todo.completed = boolean)
   }
  },
  filteredTodos() {
    // 根据hash过滤的结果来渲染
    return filters[this.hashName](this.todos)
  }
 },
 methods: {
  addTodo() {
   if(!this.newTodo) return
   this.todos.push({
    content: this.newTodo,
    completed: false
   })
   this.newTodo = ''
   this.saveOrUpdateTodos()
  },
  removeTodo(index) {
   this.todos.splice(index, 1)
   this.saveOrUpdateTodos()
  },
  editTodo(todo) {
   // 缓存编辑项，取消编辑时使用
   // @缓存字符串数据，不要缓存todo，因为todo是对象会因为引用类型的关系导致缓存失败
   this.editCache = todo.content
   // 设置编辑标识，用来确定编辑项的样式和状态
   // @这里是对象的浅拷贝，作为引用类型todo变化同时改变editedTodo，所以不能用来做缓存数据
   this.editedTodo = todo
  },
  editDone(todo, index) {
   // 编辑完毕,复原
   this.editedTodo = null
   if(!todo.content) {
    this.removeTodo(index)
   }
   this.saveOrUpdateTodos()
  },
  editCancle(todo) {
   todo.content = this.editCache
   this.editedTodo = null
  },
  clear() {
  // this.todos = filters.active(this.todos)
  // 为了能和后台数据交互，不能单纯的只过滤，还要操作
   for(let i = 0; i < this.todos.length; i++) {
     if(this.todos[i].completed) {
       this.todos.splice(i, 1)
       i --
     }
   }
   this.saveOrUpdateTodos()
  },
  // 注册
  signUp() {
    let user = new AV.User()
    user.setUsername(this.formData.username)
    user.setPassword(this.formData.password)
    user.signUp()
    .then(loginedUser => {
      console.log(loginedUser)
      this.currentUser = this.getCurrentUser()
    },
    error => {
      alert(error)
    })
  },
  login() {
    AV.User.logIn(this.formData.username,this.formData.password)
    .then(loginedUser => {
      console.log(loginedUser)
      this.currentUser = this.getCurrentUser()
      this.fetchTodos() // 登录成功后读取 todos
    },
    error => {
      alert(error)
    })
  },
  getCurrentUser() {
    let current = AV.User.current()
    if(current) {
      let { id, createdAt, attributes: username } = current
      this.message = username.username
      return { id, createdAt, username }
    } else {
      return null
    }
  },
  logout() { //登出
    AV.User.logOut()
    this.currentUser = null
    this.message = 'todos'
    window.location.reload()
  },
  saveTodos() {
    let dataString = JSON.stringify(this.todos)
    let AVTodos = AV.Object.extend('AllTodos') // 声明一个AVTodos类,这个AllTodos可以在network里看到
    let avTodos = new AVTodos() // 新建一个todo对象
    let acl = new AV.ACL()
    acl.setReadAccess(AV.User.current(),true) // 只有这个 user 能读
    acl.setWriteAccess(AV.User.current(),true) // 只有这个 user 能写

    avTodos.set('content', dataString)
    avTodos.setACL(acl) // 设置访问控制
    avTodos.save()
           .then( todo => { 
             this.todos.id = todo.id  // 一定要记得把 id 挂到 this.todoList 上，否则下次就不会调用 updateTodos 了
             console.log('保存成功') 
            }, error => { console.log('保存失败') } )
  },
  updateTodos() {
    // 想要知道如何更新对象，先看文档 https://leancloud.cn/docs/leanstorage_guide-js.html#更新对象
    let dataString = JSON.stringify(this.todos) // JSON 在序列化这个有 id 的数组的时候，会得出怎样的结果？
    // console.log(dataString)
    let avTodos = AV.Object.createWithoutData('AllTodos', this.todos.id)
    avTodos.set('content', dataString)
    avTodos.save().then(() => console.log('更新成功'))
  },
  saveOrUpdateTodos() {
    if(this.todos.id) {
      this.updateTodos()
    } else {
      this.saveTodos()
    }
  },
  fetchTodos() {
   if(this.currentUser){
     let query = new AV.Query('AllTodos')
     query.find().then(todos => { 
       let avAllTodos = todos[0] // 因为理论上 AllTodos 只有一个，所以我们取结果的第一项
       let id = avAllTodos.id 
       this.todos = JSON.parse(avAllTodos.attributes.content) // 为什么有个 attributes？因为我从控制台看到的
       this.todos.id = id // 为什么给 todoList 这个数组设置 id？因为数组也是对象啊
      }, error => { console.log(error) })
   }
  },
  con() {
    console.log(this.filteredTodos.id)
  }
 },
 directives: {
  focus(el) {
    el.focus()
  }
 },
 created() {
   // 窗口未关闭前保存正在编辑的数据
   window.onbeforeunload = () => {
     let inputTodo = this.newTodo
     window.localStorage.setItem('textTodo', inputTodo)
   }
   this.newTodo = window.localStorage.getItem('textTodo') || ''
   // 创建实例时读取当前用户
   this.currentUser = this.getCurrentUser()
  
   this.fetchTodos()
 }
})

// hash改变时
window.addEventListener('hashchange', function() {
  // 过滤#/
  let hashName = location.hash.replace(/#\/?/, '')
  // 如果过滤器有
  if(filters[hashName]) {
    vm.hashName = hashName
  } else {
    location.hash = ''
    vm.hashName = 'all'
  }
})

