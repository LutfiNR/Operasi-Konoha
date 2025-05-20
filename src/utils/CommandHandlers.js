export const commandHandlers = {
    shutdown({terminal}){
        terminal.scene.start('Levels');
    },
    
  help({ terminal, args, commandsMeta, allowedCommands }) {
    terminal.printLine("Available commands:");
    allowedCommands.forEach(cmd => {
      const meta = commandsMeta[cmd];
      if (meta) {
        terminal.printLine(`- ${cmd}: ${meta.description}`);
      } else {
        terminal.printLine(`- ${cmd}`);
      }
    });
  },

  echo({ terminal, args }) {
    terminal.printLine(args.slice(1).join(" "));
  },

  clear({ terminal }) {
    terminal.terminalHistory = [];
  },

  ls({ terminal, levelFiles, levelDirectories }) {
    const files = Object.keys(levelFiles);
    const dirs = levelDirectories;
    terminal.printLine([...files, ...dirs].join("  "));
  },

  cat({ terminal, args, levelFiles }) {
    const fileName = args[1];
    if (!fileName) {
      terminal.printLine("Usage: cat <filename>");
      return;
    }
    const content = levelFiles[fileName];
    if (content) {
      terminal.printLine(content);
    } else {
      terminal.printLine(`File not found: ${fileName}`);
    }
  }
};
