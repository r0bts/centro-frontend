path = 'src/app/components/deportivo/actividades/deportivo-actividades.scss'
with open(path, 'r') as f:
    scss = f.read()

import re

old_anim = """@keyframes viewSlideIn {
  from {
    opacity: 0;
    transform: translateX(15px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.view-animate-slide {
  animation: viewSlideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
  will-change: transform, opacity;
}"""

new_anim = """@keyframes viewSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.view-animate-slide {
  animation: viewSlideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  will-change: transform, opacity;
}"""

scss = scss.replace(old_anim, new_anim)

with open(path, 'w') as f:
    f.write(scss)
print("Updated animation to Apple style")
