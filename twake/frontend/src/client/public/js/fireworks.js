$(function() {
    var Fireworks = function() {
        var self = this;
        var rand = function(rMi, rMa) {
            return ~~((Math.random() * (rMa - rMi + 1)) + rMi);
        }
        var hitTest = function(x1, y1, w1, h1, x2, y2, w2, h2) {
            return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
        };
        window.requestAnimFrame = function() {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(a) {
                window.setTimeout(a, 1E3 / 60)
            }
        }();
        self.init = function() {
            self.canvas = document.createElement('canvas');
            self.canvas.width = self.cw = $(window).innerWidth();
            self.canvas.height = self.ch = $(window).innerHeight();
            self.particles = [];
            self.partCount = 150;
            self.fireworks = [];
            self.mx = self.cw / 2;
            self.my = self.ch / 2;
            self.currentHue = 30;
            self.partSpeed = 5;
            self.partSpeedVariance = 10;
            self.partWind = 50;
            self.partFriction = 5;
            self.partGravity = 1;
            self.hueMin = 0;
            self.hueMax = 360;
            self.fworkSpeed = 4;
            self.fworkAccel = 10;
            self.hueVariance = 30;
            self.flickerDensity = 25;
            self.showShockwave = true;
            self.showTarget = false;
            self.clearAlpha = 25;
            $(document.body).append(self.canvas);
            self.ctx = self.canvas.getContext('2d');
            self.ctx.lineCap = 'round';
            self.ctx.lineJoin = 'round';
            self.lineWidth = 1;
            self.canvasLoop();
            self.canvas.onselectstart = function() {
                return false;
            };


            var fire = ()=>{
              if(window.document.hasFocus()){
                var left = Math.random();
                self.createFireworks(self.cw / 3 + left * self.cw / 3, self.ch, left*self.cw/2 + self.cw/4, Math.random()*self.ch/4 + self.ch/4);
              }
              setTimeout(()=>{
                fire();
              }, 500 + Math.random()*2000);
            };
            fire();
        };
        self.createParticles = function(x, y, hue) {
            var countdown = self.partCount;
            while (countdown--) {
                var newParticle = {
                    x: x,
                    y: y,
                    coordLast: [{
                        x: x,
                        y: y
                    }, {
                        x: x,
                        y: y
                    }, {
                        x: x,
                        y: y
                    }],
                    angle: rand(0, 360),
                    speed: rand(((self.partSpeed - self.partSpeedVariance) <= 0) ? 1 : self.partSpeed - self.partSpeedVariance, (self.partSpeed + self.partSpeedVariance)),
                    friction: 1 - self.partFriction / 100,
                    gravity: self.partGravity / 2,
                    hue: rand(hue - self.hueVariance, hue + self.hueVariance),
                    brightness: rand(50, 80),
                    alpha: rand(40, 100) / 100,
                    decay: rand(10, 50) / 1000,
                    wind: (rand(0, self.partWind) - (self.partWind / 2)) / 25,
                    lineWidth: self.lineWidth
                };
                self.particles.push(newParticle);
            }
        };
        self.updateParticles = function() {
            var i = self.particles.length;
            while (i--) {
                var p = self.particles[i];
                var radians = p.angle * Math.PI / 180;
                var vx = Math.cos(radians) * p.speed;
                var vy = Math.sin(radians) * p.speed;
                p.speed *= p.friction;
                p.coordLast[2].x = p.coordLast[1].x;
                p.coordLast[2].y = p.coordLast[1].y;
                p.coordLast[1].x = p.coordLast[0].x;
                p.coordLast[1].y = p.coordLast[0].y;
                p.coordLast[0].x = p.x;
                p.coordLast[0].y = p.y;
                p.x += vx;
                p.y += vy;
                p.y += p.gravity;
                p.angle += p.wind;
                p.alpha -= p.decay;
                if (!hitTest(0, 0, self.cw, self.ch, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2) || p.alpha < .05) {
                    self.particles.splice(i, 1);
                }
            };
        };
        self.drawParticles = function() {
            var i = self.particles.length;
            while (i--) {
                var p = self.particles[i];
                var coordRand = (rand(1, 3) - 1);
                self.ctx.beginPath();
                self.ctx.moveTo(Math.round(p.coordLast[coordRand].x), Math.round(p.coordLast[coordRand].y));
                self.ctx.lineTo(Math.round(p.x), Math.round(p.y));
                self.ctx.closePath();
                self.ctx.strokeStyle = 'hsla(' + p.hue + ', 100%, ' + p.brightness + '%, ' + p.alpha + ')';
                self.ctx.stroke();
                if (self.flickerDensity > 0) {
                    var inverseDensity = 50 - self.flickerDensity;
                    if (rand(0, inverseDensity) === inverseDensity) {
                        self.ctx.beginPath();
                        self.ctx.arc(Math.round(p.x), Math.round(p.y), rand(p.lineWidth, p.lineWidth + 3) / 2, 0, Math.PI * 2, false)
                        self.ctx.closePath();
                        var randAlpha = rand(50, 100) / 100;
                        self.ctx.fillStyle = 'hsla(' + p.hue + ', 100%, ' + p.brightness + '%, ' + randAlpha + ')';
                        self.ctx.fill();
                    }
                }
            };
        };
        self.createFireworks = function(startX, startY, targetX, targetY) {
            var newFirework = {
                x: startX,
                y: startY,
                startX: startX,
                startY: startY,
                hitX: false,
                hitY: false,
                coordLast: [{
                    x: startX,
                    y: startY
                }, {
                    x: startX,
                    y: startY
                }, {
                    x: startX,
                    y: startY
                }],
                targetX: targetX,
                targetY: targetY,
                speed: self.fworkSpeed,
                angle: Math.atan2(targetY - startY, targetX - startX),
                shockwaveAngle: Math.atan2(targetY - startY, targetX - startX) + (90 * (Math.PI / 180)),
                acceleration: self.fworkAccel / 100,
                hue: self.currentHue,
                brightness: rand(50, 80),
                alpha: rand(50, 100) / 100,
                lineWidth: self.lineWidth
            };
            self.fireworks.push(newFirework);
        };
        self.updateFireworks = function() {
            var i = self.fireworks.length;
            while (i--) {
                var f = self.fireworks[i];
                self.ctx.lineWidth = f.lineWidth;
                vx = Math.cos(f.angle) * f.speed, vy = Math.sin(f.angle) * f.speed;
                f.speed *= 1 + f.acceleration;
                f.coordLast[2].x = f.coordLast[1].x;
                f.coordLast[2].y = f.coordLast[1].y;
                f.coordLast[1].x = f.coordLast[0].x;
                f.coordLast[1].y = f.coordLast[0].y;
                f.coordLast[0].x = f.x;
                f.coordLast[0].y = f.y;
                if (f.startX >= f.targetX) {
                    if (f.x + vx <= f.targetX) {
                        f.x = f.targetX;
                        f.hitX = true;
                    } else {
                        f.x += vx;
                    }
                } else {
                    if (f.x + vx >= f.targetX) {
                        f.x = f.targetX;
                        f.hitX = true;
                    } else {
                        f.x += vx;
                    }
                }
                if (f.startY >= f.targetY) {
                    if (f.y + vy <= f.targetY) {
                        f.y = f.targetY;
                        f.hitY = true;
                    } else {
                        f.y += vy;
                    }
                } else {
                    if (f.y + vy >= f.targetY) {
                        f.y = f.targetY;
                        f.hitY = true;
                    } else {
                        f.y += vy;
                    }
                }
                if (f.hitX && f.hitY) {
                    self.createParticles(f.targetX, f.targetY, f.hue);
                    self.fireworks.splice(i, 1);
                }
            };
        };
        self.drawFireworks = function() {
            var i = self.fireworks.length;
            self.ctx.globalCompositeOperation = 'lighter';
            while (i--) {
                var f = self.fireworks[i];
                self.ctx.lineWidth = f.lineWidth;
                var coordRand = (rand(1, 3) - 1);
                self.ctx.beginPath();
                self.ctx.moveTo(Math.round(f.coordLast[coordRand].x), Math.round(f.coordLast[coordRand].y));
                self.ctx.lineTo(Math.round(f.x), Math.round(f.y));
                self.ctx.closePath();
                self.ctx.strokeStyle = 'hsla(' + f.hue + ', 100%, ' + f.brightness + '%, ' + f.alpha + ')';
                self.ctx.stroke();
                if (self.showTarget) {
                    self.ctx.save();
                    self.ctx.beginPath();
                    self.ctx.arc(Math.round(f.targetX), Math.round(f.targetY), rand(1, 8), 0, Math.PI * 2, false)
                    self.ctx.closePath();
                    self.ctx.lineWidth = 1;
                    self.ctx.stroke();
                    self.ctx.restore();
                }
                if (self.showShockwave) {
                    self.ctx.save();
                    self.ctx.translate(Math.round(f.x), Math.round(f.y));
                    self.ctx.rotate(f.shockwaveAngle);
                    self.ctx.beginPath();
                    self.ctx.arc(0, 0, 1 * (f.speed / 5), 0, Math.PI, true);
                    self.ctx.strokeStyle = 'hsla(' + f.hue + ', 100%, ' + f.brightness + '%, ' + rand(25, 60) / 100 + ')';
                    self.ctx.lineWidth = f.lineWidth;
                    self.ctx.stroke();
                    self.ctx.restore();
                }
            };
        };
        self.clear = function() {
            self.particles = [];
            self.fireworks = [];
            self.ctx.clearRect(0, 0, self.cw, self.ch);
        };
        self.canvasLoop = function() {
            requestAnimFrame(self.canvasLoop, self.canvas);
            self.ctx.globalCompositeOperation = 'destination-out';
            self.ctx.fillStyle = 'rgba(0,0,0,' + self.clearAlpha / 100 + ')';
            self.ctx.fillRect(0, 0, self.cw, self.ch);
            self.updateFireworks();
            self.updateParticles();
            self.drawFireworks();
            self.drawParticles();
        };
        self.init();
    }
    var fworks = new Fireworks();
});
