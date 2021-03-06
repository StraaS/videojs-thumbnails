function getValidListIndex(list, index) {
  if (index >= list.length) {
    return null
  }

  if (index < 0) {
    return null
  }

  return index
}

export default function binarySearchRange(list, target, identifier) {
  let lowIndex = -1
  let highIndex = list.length
  let middleIndex = 0
  let middleValue = null

  while (highIndex - lowIndex > 1) {
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
  }

  return [getValidListIndex(list, lowIndex), getValidListIndex(list, highIndex)]
}
