import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsuarioService, UsuarioResponse, UsuarioRequest } from '../../shared/usuario.service';
import { Rol } from '../../shared/rol.model';
import { Medico, MedicoService } from '../../shared/medico.service';

declare var Swal: any;

@Component({
  selector: 'app-gestion-usuarios',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css'
})
export class GestionUsuarios implements OnInit {
  usuarios: UsuarioResponse[] = [];
  roles: Rol[] = [];
  medicos: Medico[] = [];

  cargando = true;
  error: string | null = null;
  usuarioForm: FormGroup;
  modoEdicion = false;
  idUsuarioEditar: number | null = null;

  esRolMedico = false;

  constructor(
    private usuarioService: UsuarioService,
    private medicoService: MedicoService,
    private fb: FormBuilder
  ) {
    this.usuarioForm = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      nombreUsuario: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      clave: [''],
      idRol: [null, Validators.required],
      estado: ['ACTIVO', Validators.required],
      idMedico: [null]
    });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();

    this.f['idRol'].valueChanges.subscribe(idRolSeleccionado => {
      const rol = this.roles.find(r => r.idRol == idRolSeleccionado);
      this.esRolMedico = (rol?.nombre === 'MEDICO');

      if (!this.esRolMedico) {
        this.f['idMedico'].setValue(null);
      }
    });

    this.f['idMedico'].valueChanges.subscribe(idMedicoSeleccionado => {
      if (idMedicoSeleccionado) {
        const medicoSeleccionado = this.medicos.find(m => m.idMedico == idMedicoSeleccionado);
        if (medicoSeleccionado) {
          this.usuarioForm.patchValue({
            nombres: medicoSeleccionado.nombres,
            apellidos: medicoSeleccionado.apellidos,
            email: medicoSeleccionado.email
          });
        }
      }
    });
  }

  cargarDatosIniciales(): void {
    this.cargando = true;
    this.error = null;

    Promise.all([
      this.usuarioService.listarUsuarios().toPromise(),
      this.usuarioService.listarRoles().toPromise(),
      this.medicoService.getMedicos().toPromise()
    ]).then(([usuarios, roles, medicos]) => {
      this.usuarios = usuarios || [];
      this.roles = roles || [];
      this.medicos = medicos || [];
      this.cargando = false;
    }).catch(err => {
      this.error = 'No se pudieron cargar los datos. ' + (err.message || 'Error desconocido.');
      this.cargando = false;
    });
  }

  onSubmit(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const formValue = this.usuarioForm.value;
    const request: UsuarioRequest = {
      ...formValue,
      idMedico: this.esRolMedico ? formValue.idMedico : null,
    };

    if (this.modoEdicion && this.idUsuarioEditar) {
      if (!request.clave || request.clave.trim() === '') {
        request.clave = null;
      }
      this.usuarioService.actualizarUsuario(this.idUsuarioEditar, request).subscribe({
        next: () => {
          Swal.fire('¡Actualizado!', 'Usuario actualizado con éxito.', 'success');
          this.resetFormulario();
        },
        error: (err) => {
          Swal.fire('Error', err.message, 'error');
          this.cargando = false;
        }
      });
    } else {
      if (!request.clave || request.clave.trim() === '') {
        request.clave = null;
      }
      this.usuarioService.crearUsuario(request).subscribe({
        next: () => {
          Swal.fire('¡Creado!', 'Usuario registrado y credenciales enviadas al correo: ' + request.email, 'success');
          this.resetFormulario();
        },
        error: (err) => {
          Swal.fire('Error', err.message, 'error');
          this.cargando = false;
        }
      });
    }
  }

  cargarUsuarioParaEditar(usuario: UsuarioResponse): void {
    this.modoEdicion = true;
    this.idUsuarioEditar = usuario.idUsuario;

    const rol = this.roles.find(r => r.idRol == usuario.idRol);
    this.esRolMedico = (rol?.nombre === 'MEDICO');

    this.usuarioForm.patchValue({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      nombreUsuario: usuario.nombreUsuario,
      email: usuario.email,
      clave: '',
      idRol: usuario.idRol,
      estado: usuario.estado,
      idMedico: this.esRolMedico ? (usuario.idMedicoAsociado || null) : null
    });
    window.scrollTo(0, 0);
  }

  inactivarUsuario(usuario: UsuarioResponse): void {
    if (usuario.rolNombre === 'ADMIN') {
      Swal.fire('Acción no permitida', 'No se puede inactivar al usuario Administrador.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Está seguro?',
      text: `El usuario '${usuario.nombreUsuario}' será marcado como 'Inactivo' y no podrá iniciar sesión.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, inactivar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.cargando = true;
        this.usuarioService.inactivarUsuario(usuario.idUsuario).subscribe({
          next: () => {
            Swal.fire('¡Inactivado!', 'El usuario ha sido inactivado.', 'success');
            this.cargarDatosIniciales();
          },
          error: (err) => {
            Swal.fire('Error', err.message, 'error');
            this.cargando = false;
          }
        });
      }
    });
  }

  resetFormulario(): void {
    this.usuarioForm.reset({
      estado: 'ACTIVO',
      idRol: null,
      idMedico: null
    });
    this.modoEdicion = false;
    this.idUsuarioEditar = null;
    this.cargando = true;
    this.esRolMedico = false;
    this.cargarDatosIniciales();
  }

  get f() { return this.usuarioForm.controls; }

  esCampoInvalido(campo: string): boolean {
    const control = this.f[campo];
    return control.invalid && (control.dirty || control.touched);
  }
}