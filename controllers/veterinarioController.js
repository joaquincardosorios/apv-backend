import Veterinario from "../models/Veterinario.js"
import generarJWT from "../helpers/generarJWT.js"
import generarId from "../helpers/generarId.js"
import emailRegistro from "../helpers/emailRegistro.js"
import emailOlvidePassword from "../helpers/emailOlvidePassword.js"


const registrar = async (req,res) => {
    const { email, nombre } = req.body

    // Prevenir usuarios duplicados
    const existeUsuario = await Veterinario.findOne({ email })

    if(existeUsuario){
        const error = new Error('Usuario ya registrado');
        return res.status(400).json({msg: error.message})
    }

    try {
        //Guardar nuevo veterinario
        const veterinario = new Veterinario(req.body);
        const veterinarioGuardado = await veterinario.save();

        // Enviar el email
        emailRegistro({
            email,
            nombre,
            token: veterinarioGuardado.token
        })

        res.json(veterinarioGuardado)
    } catch (error) {
        console.log(error)
    }

}

const perfil =  (req,res) => {
    const {veterinario} = req
    res.json({perfil: veterinario})
}

const confirmar = async (req,res) => {
    const { token } = req.params;

  const usuarioConfirmar = await Veterinario.findOne({ token });

  if (!usuarioConfirmar) {
    const error = new Error("Token no válido");
    return res.status(404).json({ msg: error.message });
  }

  try {
    usuarioConfirmar.token = null;
    usuarioConfirmar.confirmado = true;
    await usuarioConfirmar.save();

    res.json({ msg: "Usuario Confirmado Correctamente" });
  } catch (error) {
    console.log(error);
  }
}

const autenticar = async (req,res) => {
    const {email, password} = req.body;
    try {
        // Comprobar si usuario existe
        const usuario = await Veterinario.findOne({email})
        if(!usuario){
            const error = new Error('El usuario no existe')
            return res.status(403).json({msg: error.message})
        } 
        // Comprobar si usuario esta confirmado
        if(!usuario.confirmado){
            const error = new Error('Tu cuenta no ha sido confirmada')
            return res.status(403).json({msg: error.message})
        } 

        //Revisar password
        if( !await usuario.comprobarPassword(password)){
            const error = new Error('La contraseña es incorrecta')
            return res.status(403).json({msg: error.message})
        } 

        // Autenticar password de usuario
        res.json({
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            token: generarJWT(usuario.id)
        })

    } catch (error) {
        console.log(error)
    }
    
}

const olvidePassword = async (req,res) => {
    const { email } = req.body;
    const veterinarioExiste = await Veterinario.findOne({email})
    if(!veterinarioExiste){
        const error = new Error('El usuario no existe')
        return res.status(403).json({msg: error.message})
    } 
    try {
        veterinarioExiste.token = generarId();
        await veterinarioExiste.save();

        //Enviar email con instrucciones
        emailOlvidePassword({
            email,
            nombre: veterinarioExiste.nombre,
            token: veterinarioExiste.token
        })

        return res.json({msg:"Se ha enviado un email con las instrucciones"})
    } catch (error) {
        console.log(error);
    }
    
}

const comprobarToken = async (req,res) => {
    const { token } = req.params;

    const tokenValido = await Veterinario.findOne({ token });
    if(!tokenValido){
        const error = new Error('Token no valido');
        return res.status(400).json({msg: error.message})
    }
    res.json({msg:"Token valido y el usuario existe"})
}

const nuevoPassword = async (req,res) => {
    const { token } = req.params;
    const { password } = req.body;

    const veterinario = await Veterinario.findOne({ token })
    if(!veterinario){
        const error = new Error('Hubo un error');
        return res.status(400).json({msg: error.message});
    }
    try {
        veterinario.token = null;
        veterinario.password = password;
        await veterinario.save();
        res.json({msg: "Password modificado correctamente"});
    } catch (error) {
        console.log(error)
    }
}

const actualizarPerfil = async (req,res) => {

    const veterinario = await Veterinario.findById(req.params.id);
    if(!veterinario){
        const error = new Error('Hubo un error')
        return res.status(400).json({msg: error.message})
    }

    const { email } = req.body
    if(veterinario.email !== email){
        const existeEmail = await Veterinario.findOne({email})
        if(existeEmail){
            const error = new Error('Ese email ya esta en uso')
            return res.status(400).json({msg: error.message})
        }
    }

    try {
        veterinario.nombre = req.body.nombre || veterinario.nombre
        veterinario.telefono = req.body.telefono
        veterinario.web = req.body.web 
        veterinario.email = req.body.email || veterinario.email

        const veterinarioActualizado = await veterinario.save()
        res.json(veterinarioActualizado)
    } catch (error) {
        console.log(error)
    }

}

const actualizarPassword = async (req,res) => {
    // Leer datos
    const { id } = req.veterinario
    const { passwordAntigua, passwordNuevo } = req.body

    // Comprobar vet exista
    const veterinario = await Veterinario.findById(id);
    if(!veterinario){
        const error = new Error('Hubo un error')
        return res.status(400).json({msg: error.message})
    }

    // Comprobar pass
    if (await veterinario.comprobarPassword(passwordAntigua)){
        // Almacenar nuevo password

        veterinario.password = passwordNuevo
        await veterinario.save()
        res.json({msg: 'Password Almacenada correctamente'})

    } else {
        const error = new Error('El password Actual es Incorrecto')
        return res.status(400).json({ msg: error.message})
    }

    
}




export {
    registrar,
    perfil,
    confirmar,
    autenticar,
    olvidePassword,
    comprobarToken,
    nuevoPassword,
    actualizarPerfil,
    actualizarPassword
}