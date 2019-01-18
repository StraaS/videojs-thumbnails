function getValidListIndex(list, index) {
  if (index >= list.length) {
    return list.length - 1
  }

  if (index < 0) {
    return 0
  }

  return index
}

export default function binarySearchClosetRange(list, target, identifier) {
  let lowIndex = -1
  let highIndex = list.length
  let middleIndex = 0
  let middleValue = null

  do {
    middleIndex = Math.floor((lowIndex + highIndex) / 2)
    if (middleIndex === list.length) {
      middleValue = +Infinity
    }
    else if (middleIndex < 0) {
      middleValue = -Infinity
    }
    else {
      middleValue = identifier(list, middleIndex)
    }

    if (middleValue < target) {
      lowIndex = middleIndex
    }
    else if (middleValue > target) {
      highIndex = middleIndex
    }
    else {
      const returnedIndex = getValidListIndex(list, middleIndex)
      return [returnedIndex, returnedIndex]
    }
  } while (highIndex - lowIndex > 1)

  return [getValidListIndex(list, lowIndex), getValidListIndex(list, highIndex)]
}
