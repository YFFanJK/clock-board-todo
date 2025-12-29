# clock-board-todo
在teojs clock-dashboard的项目上增加了较为完善的TODO看板的功能，变得更加实用

Added a more complete TODO board feature to the teojs clock-dashboard project, making it more practical.

我在逛论坛发现有一个非常有意思的项目，就是teojs创建的clock-dashboard项目（https://github.com/teojs/clock-dashboard ），旨在将闲置的旧iPad变为功能丰富的智能显示设备。让你的旧的PAD给用起来，变成一个看板，详细的可以去原作者的项目看看。

好就好在这个项目的作者提供了开发的环境，所以我在此基础上，添加了一个“TODO看板的功能”。

![todo界面](https://github.com/user-attachments/assets/1cd4aca6-8f81-4c04-aafc-53a1b5624868)


✅主题上保持了和作者原来的一样的主题基本保持一致，没有什么“割裂感”

详细的可见技术文档说明

# 💻部署步骤

## 1、下载项目

下载项目的ZIP包或者clone

完成后cd进文件夹，或者直接资源管理器进入文件夹

```bash
cd clock-dashboard-todo
```


## 2、安装依赖

```bash
npm install
```

## 3、部署项目

先shift+鼠标右键，打开一个powershell,输入

```bash
npm run start-server
```

再shift+鼠标右键，打开一个powershell,输入

```bash
pnpm dev
```

# 🙂BB两句
部署完成后，就可以通过部署设备IP:3000端口进行访问了

对于要进行代办清单的编辑，局域网任意设备进入部署设备IP:3000/?mode=edit进行新建任务
