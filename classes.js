class Shape {
    constructor(name, sides, sideLength){
        this.name = name
        this.sides = sides
        this.sideLength = sideLength
    }
    calcPerimeter(){
        console.log(this.sides * this.sideLength)
    }

}

const triangle = new Shape("triangle", 3, 3)
triangle.calcPerimeter()

class Square extends Shape {
    constructor(sideLength) {
        super("square", 4, sideLength);
    }
    calcArea(){
        console.log(this.sideLength * this.sideLength)
    }
}

const square = new Square(15)

square.calcArea()