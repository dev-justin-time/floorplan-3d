// Kitchen Floorplan Scanner Class integrated as FloorPlanProcessor
export class FloorPlanProcessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.params = {
            threshold: 128,
            minWallLength: 50,
            minContourArea: 1000
        };
    }

    async processImage(file) {
        const image = await this.loadImage(file);
        this.canvas.width = image.width;
        this.canvas.height = image.height;
        this.ctx.drawImage(image, 0, 0);

        this.grayscale();
        this.detectEdges();

        const contours = this.findContours();
        const walls = this.detectWalls(contours);

        return {
            width: this.canvas.width,
            height: this.canvas.height,
            walls: walls
        };
    }

    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            const reader = new FileReader();
            reader.onload = e => img.src = e.target.result;
            reader.readAsDataURL(file);
        });
    }

    grayscale() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        }
        this.ctx.putImageData(imageData, 0, 0);
    }

    detectEdges() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const grayscale = new Array(width * height);

        for (let i = 0; i < data.length; i += 4) {
            grayscale[i / 4] = data[i];
        }

        const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
        const edgeData = new Array(width * height).fill(0);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let pixelX = 0;
                let pixelY = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixel = grayscale[(y + ky) * width + (x + kx)];
                        pixelX += pixel * sobelX[ky + 1][kx + 1];
                        pixelY += pixel * sobelY[ky + 1][kx + 1];
                    }
                }
                const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
                edgeData[y * width + x] = magnitude > this.params.threshold ? 255 : 0;
            }
        }

        for (let i = 0; i < data.length; i += 4) {
            const val = edgeData[i / 4];
            data[i] = data[i + 1] = data[i + 2] = val;
        }
        this.ctx.putImageData(imageData, 0, 0);
    }

    findContours() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;

        const binary = new Array(width * height);
        for (let i = 0; i < data.length; i += 4) {
            binary[i / 4] = data[i] > 128 ? 1 : 0;
        }

        const contours = [];
        const visited = new Array(width * height).fill(false);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                if (binary[idx] === 1 && !visited[idx]) {
                    const contour = this.traceContour(x, y, binary, visited, width, height);
                    if (contour.length > this.params.minContourArea) {
                        contours.push(contour);
                    }
                }
            }
        }
        return contours;
    }

    traceContour(startX, startY, binary, visited, width, height) {
        const contour = [];
        const stack = [[startX, startY]];
        const directions = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const idx = y * width + x;
            if (visited[idx]) continue;
            visited[idx] = true;

            if (binary[idx] === 1) {
                contour.push([x, y]);
                for (const [dx, dy] of directions) {
                    const nx = x + dx, ny = y + dy;
                    const nIdx = ny * width + nx;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[nIdx] && binary[nIdx] === 1) {
                        stack.push([nx, ny]);
                    }
                }
            }
        }
        return contour;
    }

    detectWalls(contours) {
        const walls = [];
        for (const contour of contours) {
            const simplified = this.simplifyPolygon(contour, 5);
            if (this.isWall(simplified)) {
                walls.push(simplified);
            }
        }
        return walls;
    }

    simplifyPolygon(points, tolerance) {
        if (points.length <= 2) return points;
        let maxDist = 0, maxIdx = 0;
        const start = points[0], end = points[points.length - 1];

        for (let i = 1; i < points.length - 1; i++) {
            const dist = this.perpendicularDistance(points[i], start, end);
            if (dist > maxDist) {
                maxDist = dist;
                maxIdx = i;
            }
        }

        if (maxDist > tolerance) {
            const left = this.simplifyPolygon(points.slice(0, maxIdx + 1), tolerance);
            const right = this.simplifyPolygon(points.slice(maxIdx), tolerance);
            return [...left.slice(0, -1), ...right];
        }
        return [start, end];
    }

    perpendicularDistance(point, start, end) {
        const [x, y] = point;
        const [x1, y1] = start;
        const [x2, y2] = end;
        if (x1 === x2 && y1 === y2) return Math.sqrt((x - x1)**2 + (y - y1)**2);

        const A = x - x1, B = y - y1, C = x2 - x1, D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        const param = lenSq !== 0 ? dot / lenSq : -1;

        let xx, yy;
        if (param < 0) { xx = x1; yy = y1; }
        else if (param > 1) { xx = x2; yy = y2; }
        else { xx = x1 + param * C; yy = y1 + param * D; }

        return Math.sqrt((x - xx)**2 + (y - yy)**2);
    }

    isWall(contour) {
        if (contour.length < 2) return false;
        let len = 0;
        for (let i = 1; i < contour.length; i++) {
            len += Math.sqrt((contour[i][0] - contour[i-1][0])**2 + (contour[i][1] - contour[i-1][1])**2);
        }
        return len >= this.params.minWallLength;
    }
}