export default function Footer() {
  return (
    <footer className="mt-16 border-t py-6 text-center text-xs text-muted-foreground">
      Contains information licensed under the{" "}
      <a
        href="https://open.alberta.ca/publications/drivers-guide"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Open Government Licence – Alberta
      </a>
      , from the Alberta Driver&apos;s Guide. This site is not affiliated with
      the Government of Alberta.
    </footer>
  );
}
