#!/usr/bin/env python3
"""Leva para um .env novo só as variáveis aprovadas de um .env antigo.

Uso: migrate-env.py <lista de variáveis> <.env antigo> <.env novo> [--dry]

- Variável aprovada: grava no .env novo, trocando o valor se ela já existir lá.
- Variável fora da lista: fica para trás, e o nome sai no relatório.
- O resto do .env novo fica como está, e ele termina com permissão 600.
- Nunca imprime valores.
"""
import os
import re
import sys

LINE = re.compile(r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$")


def read_keys(path):
    with open(path, encoding="utf-8") as f:
        return [s for s in (line.strip() for line in f) if s and not s.startswith("#")]


def parse(path):
    """Linhas do arquivo e as variáveis definidas (a última definição vale)."""
    if not os.path.exists(path):
        return [], {}
    with open(path, encoding="utf-8") as f:
        lines = f.read().splitlines()
    values = {}
    for line in lines:
        m = LINE.match(line)
        if m:
            values[m.group(1)] = m.group(2)
    return lines, values


def main():
    args = [a for a in sys.argv[1:] if a != "--dry"]
    dry = "--dry" in sys.argv[1:]
    keys_file, old_env, new_env = args
    allowed = read_keys(keys_file)
    _, old = parse(old_env)
    lines, _ = parse(new_env)

    carried = [k for k in allowed if k in old]
    dropped = sorted(k for k in old if k not in allowed)

    if not dry and carried:
        pending = {k: old[k] for k in carried}
        out = []
        for line in lines:
            m = LINE.match(line)
            if m and m.group(1) in pending:
                key = m.group(1)
                out.append(f"{key}={pending.pop(key)}")
            else:
                out.append(line)
        if pending:
            if out and out[-1].strip():
                out.append("")
            out.append("# Trazidas da instalação antiga pelo make migrate")
            out.extend(f"{k}={v}" for k, v in pending.items())
        os.makedirs(os.path.dirname(new_env) or ".", exist_ok=True)
        fd = os.open(new_env, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write("\n".join(out) + "\n")
        os.chmod(new_env, 0o600)

    print(f"      .env: {len(carried)} trazidas" + (f" ({', '.join(carried)})" if carried else ""))
    if dropped:
        print(f"      .env: {len(dropped)} deixadas para trás ({', '.join(dropped)})")


if __name__ == "__main__":
    main()
