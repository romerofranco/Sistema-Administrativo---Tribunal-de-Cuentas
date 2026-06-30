const { contextBridge, ipcRenderer } = require('electron')

// Exponer APIs seguras al proceso de renderizado via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // Información del sistema
  estaEnElectron: true,
  plataforma: process.platform,

  // Diálogos del sistema
  seleccionarArchivo: (opciones) =>
    ipcRenderer.invoke('dialogo:seleccionarArchivo', opciones),
  seleccionarCarpeta: () =>
    ipcRenderer.invoke('dialogo:seleccionarCarpeta'),
  guardarArchivo: (opciones) =>
    ipcRenderer.invoke('dialogo:guardarArchivo', opciones),

  // Abrir archivo en el explorador
  abrirEnExplorador: (ruta) =>
    ipcRenderer.invoke('shell:abrirEnExplorador', ruta),

  // Notificaciones de escritorio
  mostrarNotificacion: (titulo, cuerpo) =>
    ipcRenderer.invoke('notificacion:mostrar', { titulo, cuerpo }),

  // Listener para eventos del proceso principal
  escuchar: (canal, callback) => {
    const canalesValidos = ['sync:completado', 'app:actualizar']
    if (canalesValidos.includes(canal)) {
      ipcRenderer.on(canal, callback)
    }
  },
  dejarDeEscuchar: (canal) => {
    ipcRenderer.removeAllListeners(canal)
  },
})
