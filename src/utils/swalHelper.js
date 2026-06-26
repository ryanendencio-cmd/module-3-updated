import Swal from 'sweetalert2';

const MySwal = Swal.mixin({
  customClass: {
    popup: 'swal-popup',
    title: 'swal-title',
    htmlContainer: 'swal-html',
    confirmButton: 'swal-confirm-btn',
    cancelButton: 'swal-cancel-btn',
  },
  buttonsStyling: false,
});

export const confirmAction = async ({
  title = 'Are you sure?',
  text = "You won't be able to revert this!",
  icon = 'warning',
  confirmText = 'Yes, proceed',
  cancelText = 'Cancel',
}) => {
  const result = await MySwal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
  return result.isConfirmed;
};

export const showAlert = ({ title, text, icon = 'info' }) => {
  return MySwal.fire({
    title,
    text,
    icon,
    confirmButtonText: 'OK',
  });
};

export const showHtmlAlert = ({ title, html, icon = 'info', confirmText = 'OK' }) => {
  return MySwal.fire({
    title,
    html,
    icon,
    confirmButtonText: confirmText,
  });
};

export const confirmHtmlAction = async ({
  title,
  html,
  icon = 'warning',
  confirmText = 'Yes',
  cancelText = 'No',
}) => {
  const result = await MySwal.fire({
    title,
    html,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
  return result.isConfirmed;
};


export const showSuccessToast = (title) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });
  return Toast.fire({
    icon: 'success',
    title
  });
};

export const showLoading = (title = 'Loading...') => {
  MySwal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      MySwal.showLoading();
    },
  });
};

export const closeLoading = () => {
  MySwal.close();
};
