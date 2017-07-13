import {isObject, isArray} from 'sav-util'

export function normalizeMap (map) {
  return Array.isArray(map) ? map.map(key => {
    return {
      key: key,
      val: key
    }
  }) : Object.keys(map).map(key => {
    return {
      key: key,
      val: map[key]
    }
  })
}

// 深度比较复制
export function testAndUpdateDeepth (oldState, newState, defineReactive, isVueRoot) {
  Object.keys(newState).forEach((name) => {
    if (!(name in oldState)) {
      // 新加入的属性
      return defineReactive(oldState, name, newState[name])
    }
    // 旧的比较赋值
    let newValue = newState[name]
    let oldValue = oldState[name]
    if (isObject(newValue)) {
      if (!isObject(oldValue)) { // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        delete oldState[name] // 需要先删除
        defineReactive(oldState, name, newValue)
        if (isVueRoot) { // 必须再通知一下
          oldValue.__ob__.dep.notify()
        }
      } else { // 继续深度比较赋值
        testAndUpdateDeepth(oldState[name], newValue, defineReactive)
      }
    } else if (isArray(newValue)) {
      if (!isArray(oldValue)) { // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        delete oldState[name] // 需要先删除
        defineReactive(oldState, name, newValue)
        if (isVueRoot) { // 必须再通知一下
          oldValue.__ob__.dep.notify()
        }
      } else {
        testAndUpdateArray(oldValue, newValue, defineReactive)
      }
    } else { // 简单类型 直接赋值
      oldState[name] = newState[name]
    }
  })
}

function testAndUpdateArray (oldValue, newValue, defineReactive) {
  let oldLen = oldValue.length
  let newLen = newValue.length
  if (oldLen > newLen) { // 多了删掉
    oldValue.splice(newLen, oldLen)
  } else if (oldLen < newLen) { // 少了补上
    while (oldValue.length < newLen) {
      oldValue.push(null)
    }
  }
  newValue.forEach((it, id) => {
    if (isObject(it)) {
      if (!isObject(oldValue[id])) { // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        oldValue.splice(id, 1, it)
      } else { // 复制对象
        testAndUpdateDeepth(oldValue[id], it, defineReactive)
      }
    } else if (isArray(it)) {
      if (!isArray(oldValue[id])) { // @TEST 类型不匹配, 直接赋值, 正常情况不应该这样
        oldValue.splice(id, 1, it)
      } else {
        testAndUpdateArray(oldValue[id], it, defineReactive)
      }
    } else { // 简单类型 直接赋值
      if (it !== oldValue[id]) {
        oldValue.splice(id, 1, it)
      }
    }
  })
}