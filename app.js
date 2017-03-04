// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import 'todomvc-app-css/index.css'
import 'animate.css'
// Vue.config.productionTip = false

/* eslint-disable no-new */
// new Vue({
//   el: '#app',
//   router,
//   template: '<App/>',
//   components: { App }
// })

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
  newTodo: '',
  todos: [
   {
    content: 'thing',
    completed: false
   },
   {
    content: 'todo',
    completed: false
   }
  ],
  editedTodo: null,
  hashName: 'all'
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
  },
  removeTodo(index) {
   this.todos.splice(index, 1)
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
  },
  editCancle(todo) {
   todo.content = this.editCache
   this.editedTodo = null
  },
  clear() {
   this.todos = filters.active(this.todos)
  }
 },
 directives: {
  focus(el) {
    el.focus()
  }
 },
 created() {
   // 窗口未关闭前保存数据
   window.onbeforeunload = () => {
     let dataString = JSON.stringify(this.todos)
     window.localStorage.setItem('myTodos', dataString)
   }
   // 创建实例时提取数据
   let oldDataString = window.localStorage.getItem('myTodos')
   let oldData = JSON.parse(oldDataString)
   this.todos = oldData || []
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
