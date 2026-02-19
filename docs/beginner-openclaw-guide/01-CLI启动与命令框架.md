# 01 CLI 启动与命令框架

## 模块目标

理解 `openclaw ...` 命令从输入到真正进入业务函数的全过程。

## 步骤一：实现拆解（执行链路）

1. 入口文件 `src/entry.ts`
2. 运行主流程 `src/cli/run-main.ts`
3. 快速路由（部分命令直接执行）`src/cli/route.ts`
4. 构建 Commander 程序 `src/cli/program/build-program.ts`
5. 命令注册器（懒加载）`src/cli/program/command-registry.ts`
6. 执行目标命令（例如 message/status/models）

## 步骤二：细粒度讲解（小白版）

1. `src/entry.ts` 先做环境清理和保护
- 设置进程名为 `openclaw`
- 处理 `--no-color`
- 避免 Node 实验警告污染输出
- 必要时“重启自己”并带上参数（保证启动环境一致）

2. `src/cli/run-main.ts` 再做运行前准备
- 读取 `.env`
- 标准化环境变量
- 对某些只读命令跳过 PATH 检查，提升速度
- 调 `tryRouteCli` 尝试快路径

3. 快路径命令由 `src/cli/program/routes.ts` 定义
- 如 `status`、`health`、`models list` 可直接调函数
- 优点: 冷启动更快，减少不必要的命令注册

4. 普通路径会走 `buildProgram()`
- 统一创建 `Command` 实例
- 注入上下文 `ProgramContext`
- 注册帮助信息和 pre-action 钩子

5. 命令不是一次性全部加载，而是“懒加载”
- `command-registry.ts` 先注册占位命令
- 真正执行时再动态 `import` 对应模块
- 例如 `message` 命令在 `src/cli/program/register.message.ts` 中细分子命令

6. 插件命令可插入同一 CLI
- `run-main.ts` 在合适时机调用插件 CLI 注册
- 这样扩展包也可以拥有自己的命令


